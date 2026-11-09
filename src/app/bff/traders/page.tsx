import { Suspense } from 'react'
import { CardSkeletons } from '@/components/CardSkeletons'
import { TraderSearch } from '@/app/bff/traders/TraderSearch'

export default function TradersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Traders</h1>
      <Suspense fallback={<CardSkeletons label="Loading traders" />}>
        <TraderSearch />
      </Suspense>
    </div>
  )
}