const zar = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })

// The API sends money as whole cents. We never turn cents into a fractional
// floating-point number: we build an exact decimal STRING ("450.00") and
// Intl.NumberFormat formats that string exactly as written.
// formatCents(45000) is "R 450,00", with a no-break space after the R.
export function formatCents(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Expected a whole number of cents, got ${cents}`)
  }
  const sign = cents < 0 ? '-' : ''
  const absolute = Math.abs(cents)
  const remainder = absolute % 100
  const rands = (absolute - remainder) / 100
  return zar.format(`${sign}${rands}.${String(remainder).padStart(2, '0')}` as `${number}`)
}
