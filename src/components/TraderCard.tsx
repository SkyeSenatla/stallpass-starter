import Link from 'next/link'
import type { TraderSummary } from '@/api/types'
import { PermitStatusBadge } from '@/components/PermitStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// One trader in the officer's search results. The whole card is one link:
// "Open Zanele Dlamini" to a screen reader.
export function TraderCard({ trader }: { trader: TraderSummary }) {
  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          <h2 className="text-base">
            <Link href={`/traders/${trader.id}`} aria-label={`Open ${trader.name}`} className="after:absolute after:inset-0">
              {trader.name}
            </Link>
          </h2>
        </CardTitle>
        <PermitStatusBadge status={trader.permitStatus} />
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {trader.permitNumber} · {trader.stallTypeName}
      </CardContent>
    </Card>
  )
}
