import type { PermitStatus } from '@/api/types'
import { Badge } from '@/components/ui/badge'

// The word says the status; the colour only repeats it.
export function PermitStatusBadge({ status }: { status: PermitStatus }) {
  return status === 'active' ? <Badge variant="secondary">Active</Badge> : <Badge variant="destructive">Revoked</Badge>
}
