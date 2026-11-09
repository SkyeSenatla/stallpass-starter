import Link from 'next/link'
import { Suspense } from 'react'
import { ApiError } from '@/api/errors'
import { CardSkeletons } from '@/components/CardSkeletons'
import { ErrorView } from '@/components/ErrorView'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { readOrFail, signedInApi } from '@/lib/api'
import { formatWhen } from '@/lib/dates'

// A trader's applications: drafts to carry on with, and submitted ones.
export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold">My applications</h1>
        <Link href="/apply" className="text-sm font-medium underline underline-offset-4">
          Apply for a stall
        </Link>
      </div>
      <Suspense fallback={<CardSkeletons label="Loading your applications" count={2} />}>
        <Applications />
      </Suspense>
    </div>
  )
}

async function Applications() {
  const { api } = await signedInApi()
  const applications = readOrFail(await api.GET('/api/v1/applications'))
  if (applications instanceof ApiError) return <ErrorView error={applications} />
  if (applications.length === 0) return <p>You haven&apos;t applied for a stall yet.</p>

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {applications.map((application) => (
        <li key={application.id}>
          <Card className="relative h-full">
            <CardHeader>
              <CardTitle>
                <h2 className="text-base">
                  <Link href={`/applications/${application.id}`} className="after:absolute after:inset-0">
                    {application.tradingName}
                  </Link>
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>
                {application.id} · {application.stallTypeName}
              </p>
              <p>
                {application.status === 'draft'
                  ? `Draft: ${application.documents.length} of ${application.requiredDocuments.length} documents uploaded`
                  : `Submitted ${application.submittedAt ? formatWhen(application.submittedAt) : ''}`}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
