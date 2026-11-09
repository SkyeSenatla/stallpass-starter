'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { RevocationPreview } from '@/api/types'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCents } from '@/lib/money'

type Failure = {
  message: string
  reference?: string | null
  field?: string
}

export function RevokeDialog({ permitNumber }: { permitNumber: string }) {
  const router = useRouter()
  const reasonId = useId()
  const previewRequest = useRef(0)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<RevocationPreview | null>(null)
  const [error, setError] = useState<Failure | null>(null)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  async function changeOpen(next: boolean) {
    if (pending) return
    setOpen(next)

    const request = ++previewRequest.current
    if (!next) return

    setReason('')
    setError(null)
    setPreview(null)

   
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Revoke</Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke permit {permitNumber}?</AlertDialogTitle>
          <AlertDialogDescription aria-live="polite">
            {preview
              ? `Revoking ${preview.traderName}’s permit cancels ${preview.bookingsCancelled} upcoming bookings and refunds ${formatCents(preview.refundCents)}. Last trading day: ${preview.lastTradingDay}.`
              : error
                ? 'Close the dialog and try opening it again.'
                : 'Loading the revocation preview…'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!preview || pending) return
            setError(null)
          }}
        >
          {preview && (
            <div className="space-y-2">
              <Label htmlFor={reasonId}>Reason for revocation</Label>
              <Textarea
                id={reasonId}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-invalid={Boolean(error?.field)}
                aria-describedby={error?.field ? `${reasonId}-error` : undefined}
              />
              <div id={`${reasonId}-error`} role="alert" className="text-sm text-destructive">
                {error?.field}
                {error?.field && error.reference && <p>Reference: {error.reference}</p>}
              </div>
            </div>
          )}

          <div role="alert" className="text-sm text-destructive">
            {error && !error.field && (
              <>
                {error.message}
                {error.reference && <p>Reference: {error.reference}</p>}
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" aria-disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" aria-disabled={!preview || pending}>
              Revoke permit {permitNumber}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}