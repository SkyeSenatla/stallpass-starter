'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { RequiredDocument, UploadedDocument } from '@/api/types'
import {
  removeDocument,
  submitApplication,
  uploadDocument,
} from '@/app/actions/applications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkDocument, documentTypes } from '@/lib/documentCheck'

export function StepHeading({ children }: { children: string }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [children])

  return (
    <h1 ref={heading} tabIndex={-1} className="text-xl font-semibold">
      {children}
    </h1>
  )
}

function showFailure(message: string, reference?: string | null) {
  toast.error(message, {
    description: reference ? `Reference: ${reference}` : undefined,
    duration: Infinity,
    closeButton: true,
  })
}

export function DocumentRow({
  applicationId,
  required,
  uploaded,
}: {
  applicationId: string
  required: RequiredDocument
  uploaded?: UploadedDocument
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const upload = useRef<HTMLButtonElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-2 rounded border p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (pending) return

        const file = input.current?.files?.[0] ?? null
        const message = checkDocument(file)
        setError(message)
        if (message || !file) return

        const form = new FormData()
        form.set('file', file)

        startTransition(async () => {
          try {
            const result = await uploadDocument(applicationId, required.kind, form)
            if (result.ok) {
              if (input.current) input.current.value = ''
              toast.success('Document uploaded.')
            } else if (result.field) {
              setError(result.message)
            } else {
              showFailure(result.message, result.reference)
            }
          } catch {
            showFailure('Could not upload the document. Try again.')
          }
        })
      }}
    >
      <Label htmlFor={id}>{required.label}</Label>
      {uploaded && <p className="text-sm">{uploaded.fileName}</p>}

      <Input
        ref={input}
        id={id}
        type="file"
        accept={documentTypes.join(',')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={() => setError(null)}
      />

      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button ref={upload} type="submit" aria-disabled={pending}>
          Upload
        </Button>

        {uploaded && (
          <Button
            type="button"
            variant="outline"
            aria-disabled={pending}
            onClick={() => {
              if (pending) return
              upload.current?.focus()

              startTransition(async () => {
                try {
                  const result = await removeDocument(applicationId, uploaded.id)
                  if (result.ok) toast.success('Document removed.')
                  else showFailure(result.message, result.reference)
                } catch {
                  showFailure('Could not remove the document. Try again.')
                }
              })
            }}
          >
            Remove
          </Button>
        )}
      </div>

      <p role="status" className="sr-only">
        {pending ? 'Saving document changes' : ''}
      </p>
    </form>
  )
}

export function SubmitApplication({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<{
    message: string
    reference?: string | null
  } | null>(null)

  return (
    <div className="space-y-2">
      <Button
        type="button"
        aria-disabled={pending}
        onClick={() => {
          if (pending) return
          setError(null)

          startTransition(async () => {
            try {
              const result = await submitApplication(id)
              if (result.ok) router.replace(`/applications/${id}`)
              else setError(result)
            } catch {
              setError({ message: 'Could not submit the application. Try again.' })
            }
          })
        }}
      >
        {pending ? 'Submitting…' : 'Submit application'}
      </Button>

      <div role="alert">
        {error && (
          <>
            {error.message}
            {error.reference && <p>Reference: {error.reference}</p>}
          </>
        )}
      </div>
    </div>
  )
}