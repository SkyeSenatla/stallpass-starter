import { createLoader, parseAsStringLiteral } from 'nuqs/server'
import type { Application } from '@/api/types'

// A stall application as a state machine (Week 9 Day 1).
//
// While it's a draft, the application is in exactly one of three steps.
// Once submitted, the form is over: it's shown read-only. The step lives in
// the URL (?step=documents), so Back, a reload and a shared link all land on
// the same step. The data lives in the API: "Save and continue" creates the
// draft, and documents attach to it.
export const steps = ['details', 'documents', 'review'] as const
export type Step = (typeof steps)[number]

export const stepLabels: Record<Step, string> = {
  details: 'Details',
  documents: 'Documents',
  review: 'Review and submit',
}

// The URL is input: ?step=banana means "no step asked for".
export const loadStep = createLoader({ step: parseAsStringLiteral(steps) })

export type FlowState =
  | { kind: 'step'; step: Step; missing: string[] }
  // The URL asked for a step the person can't be on (or for none): go here.
  | { kind: 'redirect'; step: Step }
  | { kind: 'submitted' }

// Given the step the URL asked for and the application as the API has it,
// where is the person? `missing` lists the labels of required documents not
// uploaded yet.
// - Submitted: the form is over.
// - Review needs every required document; asked for too early, Documents.
// - No step asked for: the first step with something left to do, so the URL
//   always names the step on screen.
//
// Round 1: write this, then test it in Round 3. It's pure: no fetching, no
// redirecting. The page does those with what it returns.
  export function resolveStep(
  requested: Step | null,
  application: Application,
): FlowState {
  if (application.status === 'submitted') {return { kind: 'submitted' }}

  const missing = application.requiredDocuments
    .filter((required) =>
      !application.documents.some((document) => document.kind === required.kind),
    )
    .map((required) => required.label)

  if (requested === null || (requested === 'review' && missing.length > 0)) {
    return {
      kind: 'redirect',
      step: missing.length > 0 ? 'documents' : 'review',
    }
  }

  return { kind: 'step', step: requested, missing }
}
