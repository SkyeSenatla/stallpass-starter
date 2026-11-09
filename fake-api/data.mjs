// StallPass's seed data. Restarting the API restores all of it.

export const PASSWORD = 'StallPass-2026!'

// What each kind of document is called on screen.
export const documentLabels = {
  'id-copy': 'Certified ID copy',
  'proof-of-address': 'Proof of address',
  'health-certificate': 'Certificate of acceptability (food)',
  'healer-registration': 'Traditional health practitioner registration',
}

// Public. The documents a stall type needs come from here, not from the
// frontend: a cooked-food stall needs a health certificate, clothing doesn't.
export const stallTypes = [
  { id: 'cooked-food', name: 'Cooked food', feeCents: 45000, dayFeeCents: 2500, requiredDocuments: ['id-copy', 'proof-of-address', 'health-certificate'] },
  { id: 'fresh-produce', name: 'Fresh produce', feeCents: 30000, dayFeeCents: 1500, requiredDocuments: ['id-copy', 'proof-of-address'] },
  { id: 'clothing', name: 'Clothing and textiles', feeCents: 30000, dayFeeCents: 1500, requiredDocuments: ['id-copy', 'proof-of-address'] },
  { id: 'traditional-medicine', name: 'Traditional medicine', feeCents: 35000, dayFeeCents: 2000, requiredDocuments: ['id-copy', 'proof-of-address', 'healer-registration'] },
]

// Lower-case day codes. The market is closed on Sundays.
export const tradingDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const users = [
  { id: 'u-officer', name: 'Nomvula Dlamini', email: 'officer@stallpass.test', role: 'officer' },
  { id: 'u-thandeka', name: 'Thandeka Mthembu', email: 'thandeka@stallpass.test', role: 'trader' },
  { id: 'u-sibusiso', name: 'Sibusiso Ndlovu', email: 'sibusiso@stallpass.test', role: 'trader' },
  { id: 'u-ayanda', name: 'Ayanda Khumalo', email: 'ayanda@stallpass.test', role: 'trader' },
]

// The officer's side: every trader at the market and their permit.
const traderRows = [
  ['T-01', 'Sibusiso Ndlovu', 'P-1004', 'fresh-produce', 'active', 3],
  ['T-02', 'Zanele Dlamini', 'P-1001', 'cooked-food', 'active', 5],
  ['T-03', 'Priya Naidoo', 'P-1002', 'clothing', 'active', 2],
  ['T-04', 'Mandla Dlamini', 'P-1003', 'fresh-produce', 'revoked', 0],
  ['T-05', 'Lindiwe Mkhize', 'P-1005', 'traditional-medicine', 'active', 4],
  ['T-06', 'Kavitha Pillay', 'P-1006', 'cooked-food', 'active', 6],
  ['T-07', 'Bongani Zungu', 'P-1007', 'clothing', 'active', 1],
  ['T-08', 'Nokuthula Shabalala', 'P-1008', 'fresh-produce', 'active', 3],
  ['T-09', 'Rajesh Govender', 'P-1009', 'clothing', 'active', 0],
  ['T-10', 'Thulani Ndlovu', 'P-1010', 'cooked-food', 'active', 2],
  ['T-11', 'Sizwe Dlamini-Mokoena', 'P-1011', 'fresh-produce', 'active', 4],
  ['T-12', 'Fatima Moosa', 'P-1012', 'clothing', 'active', 3],
  ['T-13', 'Sipho Mthethwa', 'P-1013', 'traditional-medicine', 'active', 2],
  ['T-14', 'Nandi Ngcobo', 'P-1014', 'cooked-food', 'revoked', 0],
  ['T-15', 'Deshan Moodley', 'P-1015', 'fresh-produce', 'active', 5],
  ['T-16', 'Busisiwe Zulu', 'P-1016', 'clothing', 'active', 1],
  ['T-17', 'Themba Khumalo', 'P-1017', 'cooked-food', 'active', 3],
  ['T-18', 'Gugu Mhlongo', 'P-1018', 'fresh-produce', 'active', 2],
  ['T-19', 'Anesh Reddy', 'P-1019', 'clothing', 'active', 4],
  ['T-20', 'Phumzile Cele', 'P-1020', 'traditional-medicine', 'active', 1],
  ['T-21', 'Mbali Nxumalo', 'P-1021', 'cooked-food', 'active', 6],
  ['T-22', 'Lungelo Gumede', 'P-1022', 'fresh-produce', 'active', 0],
  ['T-23', 'Ayesha Essop', 'P-1023', 'clothing', 'active', 2],
  ['T-24', 'Vusi Majola', 'P-1024', 'fresh-produce', 'active', 3],
]

export function seedTraders() {
  return traderRows.map(([id, name, permitNumber, stallTypeId, status, upcomingBookings], i) => ({
    id,
    name,
    permitNumber,
    stallTypeId,
    permitStatus: status,
    upcomingBookings,
    // A phone number: personal information, shown only on the trader's page.
    phone: `082 555 ${String(1000 + i * 37).slice(-4)}`,
    issuedOn: `2026-0${(i % 8) + 1}-1${i % 9}`,
    revokedReason: status === 'revoked' ? 'Trading outside the permitted hours, after two written warnings.' : null,
  }))
}

// Ayanda already submitted one, so the read-only view has something to show.
export function seedApplications() {
  const now = '2026-11-02T08:15:00Z'
  return [
    {
      id: 'A-2040',
      traderId: 'u-ayanda',
      stallTypeId: 'clothing',
      tradingName: 'Ayanda Prints',
      tradingDays: ['tue', 'thu', 'sat'],
      status: 'submitted',
      documents: [
        { id: 'D-9001', kind: 'id-copy', fileName: 'id.pdf', sizeBytes: 182044, uploadedAt: now },
        { id: 'D-9002', kind: 'proof-of-address', fileName: 'municipal-bill.pdf', sizeBytes: 240311, uploadedAt: now },
      ],
      createdAt: now,
      submittedAt: '2026-11-02T08:40:00Z',
    },
  ]
}
