from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase_client import get_caller_profile, get_service_client, require_role

router = APIRouter()

STAGE_SEQUENCE = ["dept_head", "school_admin", "facilities"]


class DecisionIn(BaseModel):
    proposal_id: str
    decision: str  # "approve" | "reject" | "revise"
    remarks: str | None = None


@router.post("/decide")
def decide(body: DecisionIn, profile: dict = Depends(get_caller_profile)):
    require_role(profile, "dept_head", "school_admin", "facilities")
    sb = get_service_client()

    proposal = (
        sb.table("event_proposals").select("*").eq("proposal_id", body.proposal_id).single().execute().data
    )
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if proposal["current_stage"] != profile["role"]:
        raise HTTPException(status_code=403, detail="This proposal isn't at your review stage")

    step = (
        sb.table("approval_steps")
        .select("*")
        .eq("proposal_id", body.proposal_id)
        .eq("approver_role", profile["role"])
        .eq("status", "Pending")
        .single()
        .execute()
        .data
    )

    new_step_status = {"approve": "Approved", "reject": "Rejected", "revise": "Revision Requested"}[body.decision]
    sb.table("approval_steps").update(
        {"approver_id": profile["id"], "status": new_step_status, "remarks": body.remarks, "action_date": "now()"}
    ).eq("approval_step_id", step["approval_step_id"]).execute()

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

    # approve -> advance to next stage, or close out
    idx = STAGE_SEQUENCE.index(profile["role"])
    if idx + 1 < len(STAGE_SEQUENCE):
        next_stage = STAGE_SEQUENCE[idx + 1]
        sb.table("event_proposals").update(
            {"status": "Under Review", "current_stage": next_stage}
        ).eq("proposal_id", body.proposal_id).execute()
        sb.table("approval_steps").insert(
            {
                "proposal_id": body.proposal_id,
                "approver_role": next_stage,
                "sequence_order": idx + 2,
                "status": "Pending",
            }
        ).execute()
        for row in sb.table("profiles").select("id").eq("role", next_stage).execute().data:
            _notify(sb, row["id"], body.proposal_id, "A proposal has been routed to you for review.")
        return {"status": "Under Review", "current_stage": next_stage}

    sb.table("event_proposals").update({"status": "Approved", "current_stage": "done"}).eq(
        "proposal_id", body.proposal_id
    ).execute()
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
    return {"status": "Approved"}


def _notify(sb, recipient_id: str, proposal_id: str, message: str):
    sb.table("notifications").insert(
        {"proposal_id": proposal_id, "recipient_id": recipient_id, "message": message}
    ).execute()
