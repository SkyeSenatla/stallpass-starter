import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ApiError } from '@/api/errors'
import { ApplicationSummary } from '@/components/ApplicationSummary'
import { CardSkeletons } from '@/components/CardSkeletons'
import { ErrorView } from '@/components/ErrorView'
import { Stepper } from '@/components/Stepper'
import { readOrFail, signedInApi } from '@/lib/api'
import { loadStep, resolveStep, stepLabels } from '@/lib/applicationSteps'
import { getStallTypes } from '@/lib/stallTypes'
import { DetailsForm } from '../DetailsForm'
import { DocumentRow, StepHeading, SubmitApplication } from './ApplicationControls'

type ApplicationPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function ApplicationPage(props: ApplicationPageProps) {
  return (
    <Suspense fallback={<CardSkeletons label="Loading application" />}>
      <ApplicationFlow {...props} />
    </Suspense>
  )
}

async function ApplicationFlow({
  params,
  searchParams,
}: ApplicationPageProps) {
  const [{ id }, query, { api }] = await Promise.all([
    params,
    searchParams,
    signedInApi(),
  ])

  const application = readOrFail(
    await api.GET('/api/v1/applications/{id}', { params: { path: { id } } }),
  )
  if (application instanceof ApiError) return <ErrorView error={application} />

  const base = `/applications/${id}`
  const flow = resolveStep(loadStep(query).step, application)

  if (flow.kind === 'redirect') redirect(`${base}?step=${flow.step}`)

  if (flow.kind === 'submitted') {
    if ('step' in query) redirect(base)

    return (
      <section className="space-y-4">
        <StepHeading>Application submitted</StepHeading>
        <ApplicationSummary application={application} />
      </section>
    )
  }

  if (query.step !== flow.step) redirect(`${base}?step=${flow.step}`)

  return (
    <section className="space-y-4">
      <StepHeading>{stepLabels[flow.step]}</StepHeading>
      <Stepper
        applicationId={id}
        current={flow.step}
        reviewReady={flow.missing.length === 0}
      />

      {flow.step === 'details' && (
        <DetailsForm
          applicationId={id}
          stallTypes={await getStallTypes()}
          initial={{
            stallTypeId: application.stallTypeId,
            tradingName: application.tradingName,
            tradingDays: application.tradingDays,
          }}
        />
      )}

      {flow.step === 'documents' && (
        <>
          {application.requiredDocuments.map((required) => (
            <DocumentRow
              key={required.kind}
              applicationId={id}
              required={required}
              uploaded={application.documents.find(
                (document) => document.kind === required.kind,
              )}
            />
          ))}

          {flow.missing.length === 0 && (
            <Link className="underline" href={`${base}?step=review`}>
              Continue to review
            </Link>
          )}
        </>
      )}

      {flow.step === 'review' && (
        <>
          <ApplicationSummary application={application} />
          <SubmitApplication id={id} />
        </>
      )}
    </section>
  )
}