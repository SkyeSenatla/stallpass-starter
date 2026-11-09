import { ApiError } from '@/api/errors'
import { describeError } from '@/lib/errorMessages'

export type Failure = { message: string; reference: string | null }

export function toFailure(response: Response, error: unknown): Failure {
  const apiError = ApiError.from(response, error)
  return { message: describeError(apiError), reference: apiError.correlationId }
}