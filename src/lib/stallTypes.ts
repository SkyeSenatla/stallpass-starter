import { cacheLife, cacheTag } from 'next/cache'
import { publicApi } from '@/lib/api'

// The stall types are public and the same for everyone, so they're cached
// (Week 8 Day 2): no cookies, no token, and the home page is prerendered.
export async function getStallTypes() {
  'use cache'
  cacheLife('hours')
  cacheTag('stall-types')
  const { data, response } = await publicApi().GET('/api/v1/stall-types')
  if (!response.ok || data === undefined) throw new Error(`GET /stall-types failed with ${response.status}`)
  return data
}
