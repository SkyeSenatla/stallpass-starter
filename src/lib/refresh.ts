import 'server-only'
import { decodeJwt } from 'jose'
import { publicApi } from '@/lib/api'
import type { Session } from '@/lib/session'

// Refresh when less than this is left on the access token. StallPass's
// tokens last 5 minutes, so a minute early.
const MARGIN_SECONDS = Number(process.env.REFRESH_MARGIN_SECONDS ?? 60)

export function needsRefresh(session: Session): boolean {
  // Decoded, not verified: exp only decides WHEN we refresh. Nothing is
  // allowed or refused because of it. The API still verifies every token.
  const { exp } = decodeJwt(session.accessToken)
  return exp === undefined || exp - Date.now() / 1000 < MARGIN_SECONDS
}

// One call to the API's refresh endpoint, server to server. Returns the new
// session, or null when the API says no: the refresh token has expired, was
// revoked, or was already used.
export async function refreshSession(session: Session): Promise<Session | null> {
  if (session.refreshToken === null) return null
  console.log('Refreshing the access token')

  // StallPass: the refresh token goes in the JSON body, snake_case, and
  // both new tokens come back in the body. No cookies between servers.
  const { data } = await publicApi().POST('/api/v1/auth/refresh', {
    body: { refresh_token: session.refreshToken },
  })
  if (data === undefined) return null

  // Rotation: the old refresh token is spent; keep its successor.
  return { ...session, accessToken: data.access_token, refreshToken: data.refresh_token }
}

// The fix for the rotation race. Requests that carry the SAME refresh token
// (three tabs, a page full of prefetching links) share ONE call to the API
// and all get the same new session. A request that arrives a few seconds
// late, still carrying the old cookie, gets that result too, instead of
// spending a token that's already been spent.
//
// It lives in this server's memory: right for one Next.js server, like
// ours. With several servers behind a load balancer they can't see each
// other's memory, and the API's grace window (or a shared store) takes over.
const SHARE_FOR_MS = 10_000
const recent = new Map<string, { result: Promise<Session | null>; startedAt: number }>()

export function refreshOnce(session: Session): Promise<Session | null> {
  const now = Date.now()
  for (const [token, entry] of recent) {
    if (now - entry.startedAt > SHARE_FOR_MS) recent.delete(token)
  }

  const token = session.refreshToken ?? ''
  const shared = recent.get(token)
  if (shared !== undefined) return shared.result

  const result = refreshSession(session)
  recent.set(token, { result, startedAt: now })
  return result
}
