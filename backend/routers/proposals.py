from datetime import date, time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from supabase_client import get_caller_profile, get_service_client, require_role

router = APIRouter()


class ProposalIn(BaseModel):
    venue_id: str
    event_title: str
    event_date: date
    start_time: time
    end_time: time
    purpose: str
    estimated_attendance: int
    budget_estimate: float


@router.post("")
def submit_proposal(body: ProposalIn, profile: dict = Depends(get_caller_profile)):
    require_role(profile, "student")

    if profile["verification_status"] != "Verified":
        raise HTTPException(
            status_code=403,
            detail="Your officer status hasn't been verified against the student directory yet.",
        )

    sb = get_service_client()

    # Venue capacity + deadline rules
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

    # Conflict check against existing confirmed bookings for the same venue/date
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
                "current_stage": "dept_head",
            }
        )
        .execute()
        .data[0]
    )

    sb.table("approval_steps").insert(
        {
            "proposal_id": proposal["proposal_id"],
            "approver_role": "dept_head",
            "sequence_order": 1,
            "status": "Pending",
        }
    ).execute()

    _notify_role(sb, "dept_head", proposal["proposal_id"], profile["department_id"],
                 f"New proposal '{body.event_title}' is awaiting your review.")

    return proposal


def _notify_role(sb, role: str, proposal_id: str, department_id: str | None, message: str):
    query = sb.table("profiles").select("id").eq("role", role)
    if department_id and role == "dept_head":
        query = query.eq("department_id", department_id)
    for row in query.execute().data:
        sb.table("notifications").insert(
            {"proposal_id": proposal_id, "recipient_id": row["id"], "message": message}
        ).execute()
