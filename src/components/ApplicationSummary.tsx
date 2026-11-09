import type { Application } from '@/api/types'
import { formatWhen } from '@/lib/dates'
import { formatDays } from '@/lib/days'
import { formatCents } from '@/lib/money'

// Everything an application says, for the review step and the submitted
// view: nothing is asked again (WCAG 2.2, SC 3.3.7), it's all shown here.
export function ApplicationSummary({ application }: { application: Application }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[12rem_1fr]">
      <dt className="text-muted-foreground">Trading name</dt>
      <dd>{application.tradingName}</dd>
      <dt className="text-muted-foreground">Stall type</dt>
      <dd>{application.stallTypeName}</dd>
      <dt className="text-muted-foreground">Trading days</dt>
      <dd>{formatDays(application.tradingDays)}</dd>
      <dt className="text-muted-foreground">Yearly fee</dt>
      <dd className="tabular-nums">{formatCents(application.feeCents)}</dd>
      <dt className="text-muted-foreground">Documents</dt>
      <dd>
        <ul className="space-y-1">
          {application.requiredDocuments.map((required) => {
            const uploaded = application.documents.find((document) => document.kind === required.kind)
            return (
              <li key={required.kind}>
                {required.label}: {uploaded ? `${uploaded.fileName}, uploaded ${formatWhen(uploaded.uploadedAt)}` : 'not uploaded'}
              </li>
            )
          })}
        </ul>
      </dd>
    </dl>
  )
}
