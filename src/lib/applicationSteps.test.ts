import { describe, expect, it } from 'vitest'
import type { Application } from '@/api/types'
import { resolveStep } from './applicationSteps'

type Kind = Application['requiredDocuments'][number]['kind']

const uploaded = (kind: Kind): Application['documents'][number] => ({
  id: `D-${kind}`,
  kind,
  label: kind,
  fileName: `${kind}.pdf`,
  sizeBytes: 1000,
  uploadedAt: '2026-11-09T08:00:00Z',
})

const draft: Application = {
  id: 'A-1',
  stallTypeId: 'ST-1',
  stallTypeName: 'Cooked food',
  feeCents: 45000,
  tradingName: 'Thandeka Cooks',
  tradingDays: ['mon'],
  status: 'draft',
  requiredDocuments: [
    { kind: 'id-copy', label: 'ID copy' },
    { kind: 'health-certificate', label: 'Health certificate' },
  ],
  documents: [],
  createdAt: '2026-11-09T07:00:00Z',
  submittedAt: null,
}
const oneUploaded: Application = { ...draft, documents: [uploaded('id-copy')] }
const complete: Application = { ...draft, documents: [uploaded('id-copy'), uploaded('health-certificate')] }
const submitted: Application = { ...complete, status: 'submitted', submittedAt: '2026-11-09T09:00:00Z' }

describe('resolveStep', () => {
  it('a submitted application is read-only, whatever step was asked for', () => {
    expect(resolveStep('documents', submitted)).toEqual({ kind: 'submitted' })
    expect(resolveStep(null, submitted)).toEqual({ kind: 'submitted' })
  })

  it('review asked for too early redirects to documents', () => {
    expect(resolveStep('review', oneUploaded)).toEqual({ kind: 'redirect', step: 'documents' })
  })

  it('review is allowed once every required document is uploaded', () => {
    expect(resolveStep('review', complete)).toEqual({ kind: 'step', step: 'review', missing: [] })
  })

  it('no step asked for goes to documents while something is missing', () => {
    expect(resolveStep(null, draft)).toEqual({ kind: 'redirect', step: 'documents' })
  })

  it('no step asked for goes to review when nothing is missing', () => {
    expect(resolveStep(null, complete)).toEqual({ kind: 'redirect', step: 'review' })
  })

  it('lists the labels of the missing documents', () => {
    expect(resolveStep('documents', oneUploaded)).toEqual({
      kind: 'step',
      step: 'documents',
      missing: ['Health certificate'],
    })
  })

  it('details stays available on a draft', () => {
    expect(resolveStep('details', complete)).toMatchObject({ kind: 'step', step: 'details' })
  })
})