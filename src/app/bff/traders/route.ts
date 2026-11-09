import { ApiError } from '@/api/errors'
import { publicApi } from '@/lib/api'
import { describeError } from '@/lib/errorMessages'
import { getSession } from '@/lib/session'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {return Response.json(
      { message: 'Your session has ended.' },
      { status: 401 },
    )
  }

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length === 1) {return Response.json(
      { message: 'Enter at least two characters.' },
      { status: 400 },
    )
  }

  try {
    const result = await publicApi().GET('/api/v1/traders', {
      params: { query: { q } },
      headers: { Authorization: `Bearer ${session.accessToken}` },
      signal: request.signal,
      cache: 'no-store',
    })

    if (result.response.ok) return Response.json(result.data)

    const error = ApiError.from(result.response, result.error)
    return Response.json(
      { message: describeError(error), reference: error.correlationId },
      { status: error.status },
    )
  } catch (error) {
    return Response.json({ message: describeError(error) }, { status: 502 })
  }
}