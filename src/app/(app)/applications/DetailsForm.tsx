'use client'

import { useActionState, useId } from 'react'
import { saveDetails, type DetailsState } from '@/app/actions/applications'
import type { StallType } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { dayLabels, tradingDays } from '@/lib/days'
import { formatCents } from '@/lib/money'

// Step 1, on /apply (no draft yet) and when the person comes Back to it.
// What they typed is kept after a refusal: values come back in the state.
type Props = { application: Application; stallTypes: components['schemas']['StallType'][] }
export function DetailsForm({
  applicationId,
  stallTypes,
  initial,
}: {
  applicationId: string | null
  stallTypes: StallType[]
  initial: DetailsState['values']
}) {
  const [state, formAction, pending] = useActionState(saveDetails.bind(null, applicationId), {
    values: initial,
    fieldErrors: {},
    message: null,
    correlationId: null,
  })
  const id = useId()
  const errorId = (field: string) => `${id}-${field}-error`
  const { values, fieldErrors } = state

  return (
    // The key: React resets a form after its action runs, so the fields are
    // rebuilt from the state the action returned, with what was typed.
    <form key={JSON.stringify(values)} action={formAction} className="max-w-xl space-y-5" noValidate>
      {state.message !== null && (
        <div role="alert" className="space-y-1 text-sm">
          <p className="font-medium text-red-700 dark:text-red-300">{state.message}</p>
          {state.correlationId !== null && (
            <p className="text-muted-foreground">
              Reference: <code className="select-all font-mono text-xs">{state.correlationId}</code>
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor={`${id}-type`}>Stall type</Label>
        <NativeSelect
          id={`${id}-type`}
          name="stallTypeId"
          defaultValue={values.stallTypeId}
          aria-invalid={fieldErrors.stallTypeId ? true : undefined}
          aria-describedby={fieldErrors.stallTypeId ? errorId('type') : undefined}
        >
          <option value="">Choose a stall type</option>
          {stallTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({formatCents(type.feeCents)} a year)
            </option>
          ))}
        </NativeSelect>
        {fieldErrors.stallTypeId && (
          <p id={errorId('type')} className="text-sm text-red-700 dark:text-red-300">
            {fieldErrors.stallTypeId}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${id}-name`}>Trading name</Label>
        <Input
          id={`${id}-name`}
          name="tradingName"
          defaultValue={values.tradingName}
          autoComplete="organization"
          aria-invalid={fieldErrors.tradingName ? true : undefined}
          aria-describedby={fieldErrors.tradingName ? errorId('name') : undefined}
        />
        {fieldErrors.tradingName && (
          <p id={errorId('name')} className="text-sm text-red-700 dark:text-red-300">
            {fieldErrors.tradingName}
          </p>
        )}
      </div>

      <fieldset className="space-y-2" aria-describedby={fieldErrors.tradingDays ? errorId('days') : undefined}>
        <legend className="text-sm font-medium">Trading days</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {tradingDays.map((day) => (
            <label key={day} className="flex min-h-6 items-center gap-2 text-sm">
              <input type="checkbox" name="tradingDays" value={day} defaultChecked={values.tradingDays.includes(day)} className="size-4" />
              {dayLabels[day]}
            </label>
          ))}
        </div>
        {fieldErrors.tradingDays && (
          <p id={errorId('days')} className="text-sm text-red-700 dark:text-red-300">
            {fieldErrors.tradingDays}
          </p>
        )}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save and continue'}
      </Button>
    </form>
  )
}
