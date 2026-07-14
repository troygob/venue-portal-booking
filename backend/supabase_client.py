import os
from functools import lru_cache

from fastapi import Header, HTTPException
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


@lru_cache
def get_service_client() -> Client:
    """Privileged client — bypasses RLS. Only use inside routes that
    re-verify the caller's role themselves (see require_role below)."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_caller_profile(authorization: str = Header(...)) -> dict:
    """Every request must send `Authorization: Bearer <supabase access token>`.
    We verify the token with Supabase, then load the caller's profile
    (their server-assigned role) — never trust a role sent by the client."""
    token = authorization.removeprefix("Bearer ").strip()
    sb = get_service_client()

    user_resp = sb.auth.get_user(token)
    if not user_resp or not user_resp.user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    profile = (
        sb.table("profiles").select("*").eq("id", user_resp.user.id).single().execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="No profile for this account")

    return profile.data


def require_role(profile: dict, *allowed_roles: str) -> None:
    if profile["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Your role can't perform this action")
