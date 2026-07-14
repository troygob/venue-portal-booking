"""
Venue & Event Portal — backend
Python's job here is deliberately narrow: Supabase (Postgres + Auth + RLS)
already handles storage, auth, and per-row read/write permissions directly
from the React app. FastAPI exists only for the pieces RLS can't express —
multi-table workflow logic that must be atomic and trusted:

  - advancing a proposal through the approval sequence
  - checking venue conflicts before confirming a booking
  - writing notifications + audit_log entries as one transaction

Every route here uses the Supabase *service role* key, so it bypasses RLS.
That means every route must re-check the caller's role itself before acting.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import approvals, proposals

app = FastAPI(title="Venue & Event Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # add your deployed frontend URL too
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proposals.router, prefix="/proposals", tags=["proposals"])
app.include_router(approvals.router, prefix="/approvals", tags=["approvals"])


@app.get("/health")
def health():
    return {"status": "ok"}
