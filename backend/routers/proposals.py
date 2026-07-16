from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase_client import get_caller_profile, get_service_client, require_role

router = APIRouter()

MANAGERIAL_ROLES = ("dept_head", "school_admin", "facilities")


class ProposalIn(BaseModel):
    venue_id: str
    event_title: str
    event_date: date
    start_time: time
    end_time: time
    purpose: str
    estimated_attendance: int
    budget_estimate: float


def _validate_booking(sb, body: ProposalIn):
    """Shared venue rules for both new submissions and edits: capacity,
    booking-deadline notice, and double-booking conflicts."""
    venue = sb.table("venues").select("*").eq("venue_id", body.venue_id).single().execute().data
    if not venue or venue["status"] != "Available":
        raise HTTPException(status_code=409, detail="This venue isn't available for booking.")
    if body.estimated_attendance > venue["capacity"]:
        raise HTTPException(status_code=422, detail=f"Exceeds venue capacity of {venue['capacity']}.")

    days_out = (body.event_date - date.today()).days
    if days_out < venue["booking_deadline_days"]:
        raise HTTPException(
            status_code=422,
            detail=f"This venue requires at least {venue['booking_deadline_days']} days' notice.",
        )

    existing = (
        sb.table("venue_bookings")
        .select("start_time, end_time")
        .eq("venue_id", body.venue_id)
        .eq("booking_date", body.event_date.isoformat())
        .eq("status", "Confirmed")
        .execute()
        .data
    )
    for b in existing:
        if body.start_time < b["end_time"] and body.end_time > b["start_time"]:
            raise HTTPException(status_code=409, detail="This venue is already booked for that time slot.")


def _notify_managers(sb, proposal_id: str, message: str):
    # Any of the three managerial roles can review at any time, so everyone
    # in all three roles gets notified — not routed to a single stage.
    for role in MANAGERIAL_ROLES:
        for row in sb.table("profiles").select("id").eq("role", role).execute().data:
            sb.table("notifications").insert(
                {"proposal_id": proposal_id, "recipient_id": row["id"], "message": message}
            ).execute()


@router.post("")
def submit_proposal(body: ProposalIn, profile: dict = Depends(get_caller_profile)):
    require_role(profile, "student")

    if profile["verification_status"] != "Verified":
        raise HTTPException(
            status_code=403,
            detail="Your officer status hasn't been verified against the student directory yet.",
        )

    sb = get_service_client()
    _validate_booking(sb, body)

    proposal = (
        sb.table("event_proposals")
        .insert(
            {
                "org_id": profile["org_id"],
                "officer_id": profile["id"],
                "venue_id": body.venue_id,
                "event_title": body.event_title,
                "event_date": body.event_date.isoformat(),
                "start_time": body.start_time.isoformat(),
                "end_time": body.end_time.isoformat(),
                "purpose": body.purpose,
                "estimated_attendance": body.estimated_attendance,
                "budget_estimate": body.budget_estimate,
                "status": "Pending",
            }
        )
        .execute()
        .data[0]
    )

    _notify_managers(sb, proposal["proposal_id"], f"New proposal '{body.event_title}' is awaiting your review.")

    return proposal


@router.put("/{proposal_id}")
def edit_proposal(proposal_id: str, body: ProposalIn, profile: dict = Depends(get_caller_profile)):
    """A student can edit their own proposal only while it's marked
    'Needs Revision', then resubmit it — putting it back in front of any
    managerial reviewer."""
    require_role(profile, "student")
    sb = get_service_client()

    existing = sb.table("event_proposals").select("*").eq("proposal_id", proposal_id).single().execute().data
    if not existing:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if existing["officer_id"] != profile["id"]:
        raise HTTPException(status_code=403, detail="This isn't your proposal.")
    if existing["status"] != "Needs Revision":
        raise HTTPException(status_code=409, detail="Only proposals marked 'Needs Revision' can be edited.")

    _validate_booking(sb, body)

    proposal = (
        sb.table("event_proposals")
        .update(
            {
                "venue_id": body.venue_id,
                "event_title": body.event_title,
                "event_date": body.event_date.isoformat(),
                "start_time": body.start_time.isoformat(),
                "end_time": body.end_time.isoformat(),
                "purpose": body.purpose,
                "estimated_attendance": body.estimated_attendance,
                "budget_estimate": body.budget_estimate,
                "status": "Pending",
                "date_submitted": "now()",  # starts a fresh approval cycle
            }
        )
        .eq("proposal_id", proposal_id)
        .execute()
        .data[0]
    )

    sb.table("audit_log").insert(
        {
            "action_by": profile["id"],
            "action_type": "Revised",
            "details": "Student edited and resubmitted the proposal after a revision request.",
        }
    ).execute()

    _notify_managers(sb, proposal_id, f"'{body.event_title}' was revised and resubmitted for review.")

    return proposal
