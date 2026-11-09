import Link from 'next/link'
import { stepLabels, steps, type Step } from '@/lib/applicationSteps'

// "Step 2 of 3", as a list. The current step is aria-current="step", so a
// screen reader says "current step", not just its name. A step is a link
// only when the person may go there: Review waits until every document is
// uploaded. Pass applicationId null on /apply, where there's no draft yet.
export function Stepper({ applicationId, current, reviewReady }: { applicationId: string | null; current: Step; reviewReady: boolean }) {
  return (
    <nav aria-label="Application steps">
      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((step, index) => {
          const label = `${index + 1}. ${stepLabels[step]}`
          const reachable = applicationId !== null && step !== current && (step !== 'review' || reviewReady)
          return (
            <li
              key={step}
              aria-current={step === current ? 'step' : undefined}
              className="rounded-full border px-3 py-1 aria-[current=step]:border-foreground aria-[current=step]:font-medium"
            >
              {reachable ? (
                <Link href={`/applications/${applicationId}?step=${step}`} className="underline underline-offset-4">
                  {label}
                </Link>
              ) : (
                <span className={step === current ? undefined : 'text-muted-foreground'}>{label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
