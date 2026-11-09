import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Shaped like the cards they stand in for, so nothing jumps when the data
// arrives. aria-busy + a label: a screen reader hears "Loading traders",
// not a list of empty boxes.
export function CardSkeletons({ count = 3, label }: { count?: number; label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        // Placeholders never reorder, so the index is a safe key here.
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
