// The API sends UTC instants ("…Z"). StallPass's users are in South Africa,
// so every date is shown in Africa/Johannesburg, whatever the server's or the
// browser's time zone.
const saDateTime = new Intl.DateTimeFormat('en-ZA', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Africa/Johannesburg',
})

// "28 Oct, 14:05"
export function formatWhen(isoInstant: string): string {
  return saDateTime.format(new Date(isoInstant))
}
