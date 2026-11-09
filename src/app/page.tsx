import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCents } from '@/lib/money'
import { getStallTypes } from '@/lib/stallTypes'

// Public: no session, no token. The list comes from the cache, so this whole
// page is prerendered at build time and sent at once.
export default async function Home() {
  const stallTypes = await getStallTypes()

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">StallPass</h1>
        <p>Apply for a trading stall at Warwick Junction, and keep your permit in one place.</p>
        <Link href="/applications" className="inline-block text-sm font-medium underline underline-offset-4">
          Sign in to apply
        </Link>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stalls, fees and the documents you need</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {stallTypes.map((type) => (
            <li key={type.id}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>
                    <h3 className="text-base">{type.name}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="tabular-nums">{formatCents(type.feeCents)} a year</p>
                  <p className="text-muted-foreground">{type.requiredDocuments.map((d) => d.label).join(', ')}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
