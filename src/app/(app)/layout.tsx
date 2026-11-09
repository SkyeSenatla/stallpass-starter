import Link from 'next/link'
import { Suspense } from 'react'
import { getSession } from '@/lib/session'
import { SignOutButton } from './SignOutButton'

// (app) is a route group: every signed-in page shares this sidebar, and
// "(app)" never appears in a URL.
export default function SignedInLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-svh bg-background text-foreground md:grid md:grid-cols-[15rem_1fr]">
      <aside className="space-y-6 border-b p-4 md:border-r md:border-b-0">
        <Link href="/" className="block text-lg font-semibold">
          StallPass
        </Link>
        {/* The session is request data: it waits inside Suspense, and the
            rest of the layout goes out at once. The box keeps the room the
            links need, so nothing below it jumps when they arrive. */}
        <div className="min-h-32 md:min-h-0">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <SidebarNav />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6">{children}</main>
    </div>
  )
}

async function SidebarNav() {
  const session = await getSession()
  if (session === null) return null

  // A convenience, not security: the API decides what each role may do.
  const links =
    session.role === 'officer'
      ? [{ href: '/traders', label: 'Traders' }]
      : [
          { href: '/applications', label: 'My applications' },
          { href: '/apply', label: 'Apply for a stall' },
        ]

  return (
    <nav aria-label="Main" className="space-y-6">
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-md px-2 py-1 text-sm hover:bg-muted">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="space-y-2 text-sm">
        <p className="break-words text-muted-foreground">
          {session.name} · {session.role === 'officer' ? 'Permits officer' : 'Trader'}
        </p>
        <SignOutButton />
      </div>
    </nav>
  )
}
