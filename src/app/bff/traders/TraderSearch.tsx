'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { TraderSearchResult } from '@/api/types'
import { CardSkeletons } from '@/components/CardSkeletons'
import { TraderCard } from '@/components/TraderCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Reply = { term: string } & (
  | { data: TraderSearchResult }
  | { message: string; reference?: string }
)

export function TraderSearch() {
  const query = useSearchParams()
  const router = useRouter()
  const term = query.get('q')?.trim() ?? ''
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reply, setReply] = useState<Reply | null>(null)

  function commit(value: string) {
    if (timer.current !== null) clearTimeout(timer.current)

    const url = new URL(window.location.href)
    const q = value.trim()
    if (q) url.searchParams.set('q', q)
    else url.searchParams.delete('q')

    window.history.replaceState(null, '', url)
  }

  useEffect(() => {
    function restoreInput() {
      if (timer.current !== null) clearTimeout(timer.current)
      if (input.current) {
        input.current.value =
          new URLSearchParams(window.location.search).get('q') ?? ''
      }
    }

    window.addEventListener('popstate', restoreInput)
    return () => {
      window.removeEventListener('popstate', restoreInput)
      if (timer.current !== null) clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    if (term.length === 1) return
    const controller = new AbortController()

    async function search() {
      try {
        const query = new URLSearchParams({ q: term })
        const response = await fetch(`/bff/traders?${query}`, {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status === 401) {
          if (!controller.signal.aborted) router.replace('/login?expired=1')
          return
        }

        const body = await response.json()
        if (controller.signal.aborted) return

        setReply(response.ok ? { term, data: body } : { term, ...body })
      } catch {
        if (!controller.signal.aborted) {
          setReply({ term, message: 'Could not load traders. Try again.' })
        }
      }
    }

    void search()
    return () => controller.abort()
  }, [router, term])

  const current = reply?.term === term ? reply : null
  const data = current && 'data' in current ? current.data : null

  let status = ''
  if (term.length === 1) status = 'Enter at least two characters.'
  else if (data) {
    status = `${data.total} ${data.total === 1 ? 'trader matches' : 'traders match'}.`
  }

  return (
    <div className="space-y-4">
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault()
          commit(input.current?.value ?? '')
        }}
      >
        <Label htmlFor="trader-search">Search traders by name</Label>
        <div className="flex gap-2">
          <Input
            id="trader-search"
            type="search"
            name="q"
            ref={input}
            defaultValue={term}
            onChange={(event) => {
              const value = event.currentTarget.value
              if (timer.current !== null) clearTimeout(timer.current)

              if (value.trim() === '') commit('')
              else timer.current = setTimeout(() => commit(value), 300)
            }}
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      <p role="status">{status}</p>

      {term.length !== 1 && !current && <CardSkeletons label="Loading traders" />}

      {term.length !== 1 && current && 'message' in current && (
        <div role="alert">
          {current.message}
          {current.reference && <p>Reference: {current.reference}</p>}
        </div>
      )}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.items.map((trader) => <TraderCard key={trader.id} trader={trader} />)}
        </div>
      )}
    </div>
  )
}