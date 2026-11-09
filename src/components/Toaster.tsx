'use client'

import { Toaster as Sonner } from 'sonner'

// Week 9 Day 1: one place on every page where toasts appear. Sonner announces
// them to screen readers as status messages, without moving focus.
//
// shadcn's own wrapper reads the theme from next-themes, which this app
// doesn't use: dark mode here follows the system, so "system" matches it.
export function Toaster() {
  return <Sonner theme="system" position="bottom-right" richColors />
}
