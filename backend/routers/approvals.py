from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase_client import get_caller_profile, get_service_client, require_role

router = APIRouter()

MANAGERIAL_ROLES = ("dept_head", "school_admin", "facilities")
OPEN_STATUSES = ("Pending", "Under Review")


class DecisionIn(BaseModel):
    proposal_id: str
    decision: str  # "approve" | "reject" | "revise"
    remarks: str | None = None


@router.post("/decide")
def decide(body: DecisionIn, profile: dict = Depends(get_caller_profile)):
    # Any of the three managerial roles can review and decide on any
    # proposal at any time — there is no longer a fixed reviewer order
    # (dept head -> school admin -> facilities). Whoever gets to it first
    # can approve, reject, or request revision.
    require_role(profile, *MANAGERIAL_ROLES)
    sb = get_service_client()

    proposal = (
        sb.table("event_proposals").select("*").eq("proposal_id", body.proposal_id).single().execute().data
    )
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal["status"] not in OPEN_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"This proposal is already {proposal['status']} and can't be decided on again.",
        )
    if body.decision == "reject" and not body.remarks:
        raise HTTPException(status_code=422, detail="Remarks are required to reject a proposal.")

    new_step_status = {"approve": "Approved", "reject": "Rejected", "revise": "Revision Requested"}[body.decision]

    # One append-only log row per decision, whoever made it — this is now a
    # log of who acted and when, not a workflow gate.
    prior_steps = (
        sb.table("approval_steps").select("approval_step_id").eq("proposal_id", body.proposal_id).execute().data
    )
    step = (
        sb.table("approval_steps")
        .insert(
            {
                "proposal_id": body.proposal_id,
                "approver_role": profile["role"],
                "approver_id": profile["id"],
                "sequence_order": len(prior_steps) + 1,
                "status": new_step_status,
                "remarks": body.remarks,
                "action_date": "now()",
            }
        )
        .execute()
        .data[0]
    )

    sb.table("audit_log").insert(
        {
            "approval_step_id": step["approval_step_id"],
            "action_by": profile["id"],
            "action_type": new_step_status,
            "details": body.remarks,
        }
    ).execute()

    if body.decision == "reject":
        sb.table("event_proposals").update({"status": "Rejected"}).eq("proposal_id", body.proposal_id).execute()
        _notify(sb, proposal["officer_id"], body.proposal_id, f"Your proposal was rejected. Remarks: {body.remarks}")
        return {"status": "Rejected"}

    if body.decision == "revise":
        sb.table("event_proposals").update({"status": "Needs Revision"}).eq("proposal_id", body.proposal_id).execute()
        _notify(sb, proposal["officer_id"], body.proposal_id, f"Revision requested. Remarks: {body.remarks}")
        return {"status": "Needs Revision"}

    # approve -> only counts toward finalizing once ALL THREE managerial
    # roles have approved. A reject/revise from any one of them still
    # short-circuits immediately (handled above); it's only "approve" that
    # requires unanimous sign-off. We only count approvals made since this
    # proposal's current review cycle started (its `date_submitted`), so a
    # revision-and-resubmit cycle can't be finalized by stale approvals
    # left over from before the student made changes.
    approved_steps = (
        sb.table("approval_steps")
        .select("approver_role, action_date")
        .eq("proposal_id", body.proposal_id)
        .eq("status", "Approved")
        .gte("action_date", proposal["date_submitted"])
        .execute()
        .data
    )
    approved_roles = {s["approver_role"] for s in approved_steps}

    if approved_roles >= set(MANAGERIAL_ROLES):
        sb.table("event_proposals").update({"status": "Approved"}).eq("proposal_id", body.proposal_id).execute()
        sb.table("venue_bookings").insert(
            {
                "venue_id": proposal["venue_id"],
                "proposal_id": body.proposal_id,
                "booking_date": proposal["event_date"],
                "start_time": proposal["start_time"],
                "end_time": proposal["end_time"],
            }
        ).execute()
        _notify(sb, proposal["officer_id"], body.proposal_id, "Your proposal has been fully approved.")
        return {"status": "Approved", "approved_by": sorted(approved_roles)}

    still_needed = sorted(set(MANAGERIAL_ROLES) - approved_roles)
    sb.table("event_proposals").update({"status": "Under Review"}).eq("proposal_id", body.proposal_id).execute()
    return {"status": "Under Review", "approved_by": sorted(approved_roles), "awaiting": still_needed}


def _notify(sb, recipient_id: str, proposal_id: str, message: str):
    sb.table("notifications").insert(
        {"proposal_id": proposal_id, "recipient_id": recipient_id, "message": message}
    ).execute()
