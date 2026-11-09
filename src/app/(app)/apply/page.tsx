import { Stepper } from '@/components/Stepper'
import { getStallTypes } from '@/lib/stallTypes'
import { DetailsForm } from '../applications/DetailsForm'

// Step 1 of a new application, ready-made. Saving it creates the draft and
// sends the trader to /applications/{id}?step=documents: Round 1 builds that
// page. The stall types come from the cache (the same list the public home
// page shows).
export default async function ApplyPage() {
  const stallTypes = await getStallTypes()
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Apply for a stall</h1>
      <Stepper applicationId={null} current="details" reviewReady={false} />
      <h2 className="text-lg font-semibold">Step 1 of 3: Details</h2>
      <DetailsForm applicationId={null} stallTypes={stallTypes} initial={{ stallTypeId: '', tradingName: '', tradingDays: [] }} />
    </div>
  )
}
