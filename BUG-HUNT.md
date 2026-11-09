# Bug hunt (8 minutes)

Each snippet has at least one bug from Week 9. Under each one, write:

- **What breaks, and for whom:** one line.
- **The fix:** one line.

## 1

```tsx
// The application page. The step is kept in state, not the URL.
export function ApplicationSteps({ application }: { application: Application }) {
  const [step, setStep] = useState<Step>('details')
  return step === 'documents' ? <DocumentsStep onNext={() => setStep('review')} /> : …
}
```

- What breaks, and for whom: Applicants lose theri place after reloading, the links will not restore
- The fix: Storing the step in the url resolves this and redirecting to the corrects tep when needed.  

## 2

```ts
// Checking an upload before it goes to the API
export function checkDocument(file: File): string | null {
  if (file.type !== 'application/pdf') return 'Only PDF files are accepted.'
  return null
}
// …and the Server Action sends whatever passes this straight on.
```

- What breaks, and for whom: Applicants with images or large pdf can pass the broswer checklist
- The fix: Setting the limit to 2MB limit in the broswer and theAPI validating this. 

## 3

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Revoke</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    <AlertDialogFooter>
      <AlertDialogAction onClick={revoke}>OK</AlertDialogAction>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- What breaks, and for whom: An officers cannot tell what will ahppening after clicking ok and the alert dialog closes before an API error can be read.
- The fix: Show the API preview first and then cancel. 

## 4

```tsx
'use client'
export function TraderSearch() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<TraderSummary[]>([])
  return (
    <input
      value={q}
      onChange={async (e) => {
        setQ(e.target.value)
        setResults(await searchTraders(e.target.value)) // a Server Action
      }}
    />
  )
}
```

- What breaks, and for whom: Officers send a request on every key typed also including invalid onecharacters
- The fix:Ignoring over limit requests.

## 5

```tsx
// After a failed upload
toast.error('That file is too big. The limit is 2 MB.')
```

- What breaks, and for whom:
- The fix:

## 6

```tsx
it('shows the API message under the field', async () => {
  render(<DetailsForm … />)
  await user.click(screen.getByRole('button', { name: 'Save and continue' }))
  expect(await screen.findByLabelText('Trading name')).toHaveAccessibleDescription('Give a trading name of 3 to 60 characters.')
})
```

- What breaks, and for whom:
- The fix:

## 7

```ts
// src/app/(app)/traders/[id]/page.tsx
export async function generateMetadata({ params }: PageProps<'/traders/[id]'>) {
  const trader = await getTrader((await params).id)
  return { title: `${trader.name} (${trader.phone})` }
}
```

- What breaks, and for whom:
- The fix:

## 8

```
# public/robots.txt
User-agent: *
Disallow: /traders
Disallow: /applications
```

…and the signed-in layout sets `robots: { index: false }`.

- What breaks, and for whom:
- The fix:
