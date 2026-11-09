import Link from 'next/link'
import { Suspense } from 'react'
import { ApiError } from '@/api/errors'
import { ErrorView } from '@/components/ErrorView'
import { PermitStatusBadge } from '@/components/PermitStatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { readOrFail, signedInApi } from '@/lib/api'
import { RevokeDialog } from './Revoke'

export default function TraderPage({ params }: PageProps<'/traders/[id]'>) {
  return (
    <div className="space-y-6">
      <Link href="/traders" className="text-sm underline underline-offset-4">
        Back to traders
      </Link>
      <Suspense fallback={<TraderSkeleton />}>
        <TraderDetails params={params} />
      </Suspense>
    </div>
  )
}

async function TraderDetails({ params }: Pick<PageProps<'/traders/[id]'>, 'params'>) {
  const [{ id }, { api }] = await Promise.all([params, signedInApi()])
  const trader = readOrFail(await api.GET('/api/v1/traders/{id}', { params: { path: { id } } }))
  if (trader instanceof ApiError) return <ErrorView error={trader} />

  return (
    <section className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{trader.name}</h1>
        <PermitStatusBadge status={trader.permitStatus} />
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
        <dt className="text-muted-foreground">Permit</dt>
        <dd>
          {trader.permitNumber}, issued {trader.issuedOn}
        </dd>
        <dt className="text-muted-foreground">Stall type</dt>
        <dd>{trader.stallTypeName}</dd>
        <dt className="text-muted-foreground">Phone</dt>
        <dd>{trader.phone}</dd>
        <dt className="text-muted-foreground">Upcoming bookings</dt>
        <dd>{trader.upcomingBookings}</dd>
        {trader.revokedReason !== null && (
          <>
            <dt className="text-muted-foreground">Revoked because</dt>
            <dd>{trader.revokedReason}</dd>
          </>
        )}
      </dl>
      {trader.permitStatus === 'active' && (
  <RevokeDialog permitNumber={trader.permitNumber} />
)}
    </section>
  )
}

function TraderSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the trader" className="max-w-2xl space-y-4">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-28 w-full" />
    </div>
  )
}
