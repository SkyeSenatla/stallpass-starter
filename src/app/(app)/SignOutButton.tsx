'use client'

import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

// Sign-out is a Server Action: it revokes the refresh token at the API and
// deletes the session cookie.
export function SignOutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  )
}
