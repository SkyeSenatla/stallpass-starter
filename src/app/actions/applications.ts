'use server'

import { redirect } from 'next/navigation'
import { ApiError } from '@/api/errors'
import type { TradingDay } from '@/api/types'
import { signedInApi } from '@/lib/api'
import { tradingDays } from '@/lib/days'
import { describeError } from '@/lib/errorMessages'

// The three-step application. Every step saves to the API as it goes, so
// nothing lives only in the browser. Each action is a public POST like any
// Server Action: it reads the session, takes only what it expects, and lets
// the API decide the rest.
//
// Step 1 is ready-made, below. Round 1 adds the actions for step 2 (upload
// and remove a document) and step 3 (submit) to this file.

type Field = 'stallTypeId' | 'tradingName' | 'tradingDays'

export type DetailsState = {
  values: { stallTypeId: string; tradingName: string; tradingDays: string[] }
  fieldErrors: Partial<Record<Field, string>>
  message: string | null
  correlationId: string | null
}

// Step 1: creates the draft (no applicationId yet) or saves changes to it
// (the person came Back). Either way, on to Documents.
export async function saveDetails(applicationId: string | null, _previous: DetailsState, formData: FormData): Promise<DetailsState> {
  const { api } = await signedInApi()

  const values = {
    stallTypeId: String(formData.get('stallTypeId') ?? ''),
    tradingName: String(formData.get('tradingName') ?? ''),
    tradingDays: formData.getAll('tradingDays').map(String),
  }
  const body = {
    stallTypeId: values.stallTypeId,
    tradingName: values.tradingName,
    // An allow-list: anything that isn't a day code is dropped here.
    tradingDays: tradingDays.filter((day) => values.tradingDays.includes(day)) as TradingDay[],
  }

  const result =
    applicationId === null
      ? await api.POST('/api/v1/applications', { body })
      : await api.PUT('/api/v1/applications/{id}', { params: { path: { id: applicationId } }, body })

  if (result.response.status === 401) redirect('/login?expired=1')
  if (!result.response.ok || result.data === undefined) {
    const error = ApiError.from(result.response, result.error)
    // A draft is already in progress: carry on with it instead.
    const existing = (result.error as { applicationId?: string } | undefined)?.applicationId
    if (error.status === 409 && existing) redirect(`/applications/${existing}`)
    if (error.status === 400) {
      // Each message under its own field; the API's names are the form's.
      const first = (field: Field) => error.fieldErrors[field]?.[0]
      return {
        values,
        fieldErrors: { stallTypeId: first('stallTypeId'), tradingName: first('tradingName'), tradingDays: first('tradingDays') },
        message: null,
        correlationId: null,
      }
    }
    return { values, fieldErrors: {}, message: describeError(error), correlationId: error.correlationId }
  }

  redirect(`/applications/${result.data.id}?step=documents`)
}
