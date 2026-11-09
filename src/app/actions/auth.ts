'use server'

import { redirect } from 'next/navigation'
import { ApiError } from '@/api/errors'
import { publicApi } from '@/lib/api'
import { describeLoginError } from '@/lib/errorMessages'
import { createSession, deleteSession, getSession } from '@/lib/session'

// Server Actions: they run on the Next.js server, called by a form. They're
// public endpoints too (anyone can POST to them), so they trust nothing the
// browser sends.

export type LoginState = { message: string; correlationId: string | null } | null

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  // Server to server: no CORS, no credentials: 'include'.
  const signIn = await publicApi().POST('/api/v1/auth/login', { body: { email, password } })
  if (!signIn.response.ok || signIn.data === undefined) {
    const error = ApiError.from(signIn.response, signIn.error)
    return { message: describeLoginError(error), correlationId: error.correlationId }
  }
  // StallPass: both tokens are in the body, snake_case. No Set-Cookie.
  const accessToken = signIn.data.access_token
  const refreshToken = signIn.data.refresh_token

  // Who is this? Ask once now, so every page can choose links by role.
  const me = await publicApi().GET('/api/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } })
  if (me.data === undefined) {
    return { message: describeLoginError(ApiError.from(me.response, me.error)), correlationId: null }
  }

  await createSession({ accessToken, refreshToken, name: me.data.name, email: me.data.email, role: me.data.role })

  // Back to where they were going, if that's a page on THIS site. Otherwise
  // a link like /login?next=https://evil.example would send people off-site
  // straight after a real sign-in (an open redirect).
  const next = String(formData.get('next') ?? '')
  // One slash, then anything but a second slash or a backslash: a path here.
  const safeNext = /^\/(?![/\\])/.test(next) ? next : null

  // redirect() throws, so it must stay outside any try/catch.
  redirect(safeNext ?? (me.data.role === 'officer' ? '/traders' : '/applications'))
}

export async function logout(): Promise<void> {
  // Revoke the refresh token on the API too, so the session can't be revived.
  const session = await getSession()
  if (session?.refreshToken) {
    await publicApi()
      .POST('/api/v1/auth/logout', { body: { refresh_token: session.refreshToken } })
      .catch(() => {})
  }
  await deleteSession()
  redirect('/login')
}
