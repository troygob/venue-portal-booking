import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// Small helper for calling the FastAPI backend with the current
// Supabase session token attached, for actions RLS doesn't cover
// (submitting a proposal, approving/rejecting/revising, editing a
// proposal that's been sent back for revision).
async function apiRequest(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.detail || 'Request failed')
  return json
}

export const apiPost = (path, body) => apiRequest('POST', path, body)
export const apiPut = (path, body) => apiRequest('PUT', path, body)
