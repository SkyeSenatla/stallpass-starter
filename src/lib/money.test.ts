import { describe, expect, it } from 'vitest'
import { formatCents } from './money'

// The starter's one test, so you can see Vitest run before you write your
// own: npm test. Intl puts a no-break space ( ) after the R.
describe('formatCents', () => {
  it('shows rands and cents, South African style', () => {
    expect(formatCents(45000)).toBe('R 450,00')
    expect(formatCents(4500)).toBe('R 45,00')
    expect(formatCents(1)).toBe('R 0,01')
  })

  it('refuses anything that is not a whole number of cents', () => {
    expect(() => formatCents(0.5)).toThrow(RangeError)
  })
})
