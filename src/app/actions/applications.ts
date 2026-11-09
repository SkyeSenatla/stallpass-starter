'use server'

import { redirect } from 'next/navigation'
import { ApiError } from '@/api/errors'
import type { TradingDay } from '@/api/types'
import { signedInApi } from '@/lib/api'
import { tradingDays } from '@/lib/days'
import { describeError } from '@/lib/errorMessages'
import { revalidatePath } from 'next/cache'
import { documentLimit } from '@/lib/documentCheck'
import type { DocumentKind } from '@/api/types'

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

type MutationResult =
  | { ok: true }
  | { ok: false; message: string; reference?: string | null; field?: boolean }

function mutationResult(
  response: Response,
  body: unknown,
  field?: string,
): MutationResult {
  if (response.ok) return { ok: true }
  if (response.status === 401) redirect('/login?expired=1')

  const error = ApiError.from(response, body)
  const fieldMessage = field ? error.fieldErrors[field]?.[0] : undefined

  return {
    ok: false,
    message: fieldMessage ?? describeError(error),
    reference: error.correlationId,
    field: Boolean(fieldMessage),
  }
}

export async function uploadDocument(
  id: string,
  kind: DocumentKind,
  form: FormData,
): Promise<MutationResult> {
  const { api } = await signedInApi()
  const file = form.get('file')

  if (!(file instanceof File) || file.size === 0 || file.size > documentLimit) {
    return { ok: false, field: true, message: 'Choose a non-empty file up to 2 MB.' }
  }

  const multipart = new FormData()
  multipart.set('kind', kind)
  multipart.set('file', file)

  const result = await api.POST('/api/v1/applications/{id}/documents', {
    params: { path: { id } },
    body: { kind, file: file.name },
    bodySerializer: () => multipart,
  })

  if (result.response.ok) revalidatePath(`/applications/${id}`)
  return mutationResult(result.response, result.error, 'file')
}

export async function removeDocument(
  id: string,
  documentId: string,
): Promise<MutationResult> {
  const { api } = await signedInApi()
  const result = await api.DELETE(
    '/api/v1/applications/{id}/documents/{documentId}',
    { params: { path: { id, documentId } } },
  )

  if (result.response.ok) revalidatePath(`/applications/${id}`)
  return mutationResult(result.response, result.error)
}

export async function submitApplication(id: string): Promise<MutationResult> {
  const { api } = await signedInApi()
  const result = await api.POST('/api/v1/applications/{id}/submit', {
    params: { path: { id } },
  })

  if (!result.response.ok) return mutationResult(result.response, result.error)
  revalidatePath('/applications')
  return { ok: true }
}