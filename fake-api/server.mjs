// The StallPass fake API. A real HTTP server, so your Next.js server calls it
// exactly as Matric Compass's server calls its API. No dependencies.
//
//   npm run api        then open http://localhost:4200 for the control page
//
// Everything lives in memory: restarting it resets the data and signs
// everyone out. You don't need to read this file: openapi.json is the
// contract. (The instructor's notes describe the rest.)
import crypto from 'node:crypto'
import http from 'node:http'
import { Readable } from 'node:stream'
import { documentLabels, PASSWORD, seedApplications, seedTraders, stallTypes, tradingDays, users } from './data.mjs'

const PORT = Number(process.env.FAKE_API_PORT ?? 4200)
const ACCESS_TOKEN_SECONDS = Number(process.env.ACCESS_TOKEN_SECONDS ?? 300)
const REFRESH_TOKEN_SECONDS = 8 * 60 * 60
// StallPass: 2 MB, not Matric Compass's 5 MB.
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
const SEARCH_LIMIT = 20

// A new signing key on every start, so a restart signs everyone out.
const signingKey = crypto.randomBytes(32)

let traders = seedTraders()
let applications = seedApplications()
let nextApplicationNumber = 2041
let nextDocumentNumber = 9003
const refreshTokens = new Map() // token -> { userId, family, used, expiresAt }
const revokedFamilies = new Set()
const control = { failNextUpload: false, failNextRevoke: false, slowShortSearches: false, minTokenSerial: 0 }
let tokenSerial = 0
const log = []

// ---- helpers ---------------------------------------------------------------

const b64url = (value) => Buffer.from(value).toString('base64url')

function signAccessToken(user) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ sub: user.id, role: user.role, iat: now, exp: now + ACCESS_TOKEN_SECONDS, n: ++tokenSerial }))
  const signature = crypto.createHmac('sha256', signingKey).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

function verifyAccessToken(token) {
  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) return null
  const expected = crypto.createHmac('sha256', signingKey).update(`${header}.${payload}`).digest('base64url')
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
  const now = Date.now() / 1000
  if (claims.exp <= now || claims.n < control.minTokenSerial) return null
  return users.find((u) => u.id === claims.sub) ?? null
}

function issueTokens(user, family = crypto.randomUUID()) {
  const refreshToken = crypto.randomBytes(32).toString('base64url')
  refreshTokens.set(refreshToken, { userId: user.id, family, used: false, expiresAt: Date.now() + REFRESH_TOKEN_SECONDS * 1000 })
  return { access_token: signAccessToken(user), refresh_token: refreshToken, token_type: 'Bearer', expires_in: ACCESS_TOKEN_SECONDS }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function problem(res, status, title, extra = {}) {
  const correlationId = crypto.randomBytes(16).toString('hex')
  res.writeHead(status, { 'Content-Type': 'application/problem+json; charset=utf-8' })
  res.end(JSON.stringify({ type: 'about:blank', title, status, ...extra, correlationId }))
}

function validation(res, errors) {
  problem(res, 400, 'One or more fields are invalid.', { errors })
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  if (raw === '') return {}
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Node's own fetch machinery parses multipart: no dependency needed.
async function readForm(req) {
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: Readable.toWeb(req),
    duplex: 'half',
  })
  try {
    return await request.formData()
  } catch {
    return null
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// What a file really is, from its first bytes. Its name and the browser's
// Content-Type are only claims.
function sniff(bytes) {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  return null
}

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

function publicApplication(application) {
  const type = stallTypes.find((t) => t.id === application.stallTypeId)
  return {
    id: application.id,
    stallTypeId: application.stallTypeId,
    stallTypeName: type.name,
    feeCents: type.feeCents,
    tradingName: application.tradingName,
    tradingDays: application.tradingDays,
    status: application.status,
    requiredDocuments: type.requiredDocuments.map((kind) => ({ kind, label: documentLabels[kind] })),
    documents: application.documents.map((d) => ({ ...d, label: documentLabels[d.kind] })),
    createdAt: application.createdAt,
    submittedAt: application.submittedAt ?? null,
  }
}

function traderSummary(trader) {
  const type = stallTypes.find((t) => t.id === trader.stallTypeId)
  return {
    id: trader.id,
    name: trader.name,
    permitNumber: trader.permitNumber,
    stallTypeName: type.name,
    permitStatus: trader.permitStatus,
  }
}

function traderDetail(trader) {
  return {
    ...traderSummary(trader),
    stallTypeId: trader.stallTypeId,
    phone: trader.phone,
    issuedOn: trader.issuedOn,
    upcomingBookings: trader.upcomingBookings,
    revokedReason: trader.revokedReason,
  }
}

// The South African date today, as YYYY-MM-DD.
const todayInSouthAfrica = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })

// What an application's details must look like, for create and update alike.
function checkDetails(body) {
  const errors = {}
  if (!stallTypes.some((t) => t.id === body.stallTypeId)) errors.stallTypeId = ['Choose a stall type.']
  const tradingName = typeof body.tradingName === 'string' ? body.tradingName.trim() : ''
  if (tradingName.length < 3 || tradingName.length > 60) errors.tradingName = ['Give a trading name of 3 to 60 characters.']
  const days = Array.isArray(body.tradingDays) ? body.tradingDays : null
  if (days === null || days.length === 0) errors.tradingDays = ['Choose at least one trading day.']
  else if (days.some((d) => !tradingDays.includes(d)) || new Set(days).size !== days.length) {
    errors.tradingDays = ['Trading days are mon to sat, each once. The market is closed on Sundays.']
  }
  return { errors, tradingName, days }
}

// ---- routes ----------------------------------------------------------------

async function handle(req, res, url, who) {
  const path = url.pathname
  const method = req.method

  if (method === 'GET' && path === '/') return controlPage(res)
  if (method === 'POST' && path.startsWith('/_control/')) return controlAction(res, path)

  if (method === 'GET' && path === '/api/v1/health') return send(res, 200, { status: 'ok' })

  // Public: no token needed.
  if (method === 'GET' && path === '/api/v1/stall-types') {
    return send(
      res,
      200,
      stallTypes.map((t) => ({ id: t.id, name: t.name, feeCents: t.feeCents, requiredDocuments: t.requiredDocuments.map((kind) => ({ kind, label: documentLabels[kind] })) })),
    )
  }

  if (method === 'POST' && path === '/api/v1/auth/login') {
    const body = await readJson(req)
    const user = users.find((u) => u.email === String(body?.email ?? '').trim().toLowerCase())
    if (!user || body?.password !== PASSWORD) return problem(res, 401, 'Incorrect email or password.')
    who.name = user.email
    return send(res, 200, issueTokens(user))
  }

  if (method === 'POST' && path === '/api/v1/auth/refresh') {
    const body = await readJson(req)
    const token = String(body?.refresh_token ?? '')
    const entry = refreshTokens.get(token)
    if (!entry || entry.expiresAt < Date.now() || revokedFamilies.has(entry.family)) {
      return problem(res, 401, 'This refresh token is not valid. Sign in again.')
    }
    if (entry.used) {
      revokedFamilies.add(entry.family)
      console.log(`  !! Refresh token reuse detected: every token in that family is now revoked`)
      return problem(res, 401, 'This refresh token was already used. Sign in again.')
    }
    entry.used = true
    const user = users.find((u) => u.id === entry.userId)
    who.name = user.email
    return send(res, 200, issueTokens(user, entry.family))
  }

  if (method === 'POST' && path === '/api/v1/auth/logout') {
    const body = await readJson(req)
    const entry = refreshTokens.get(String(body?.refresh_token ?? ''))
    if (entry) revokedFamilies.add(entry.family)
    res.writeHead(204)
    return res.end()
  }

  // Everything below needs a valid access token.
  if (!path.startsWith('/api/v1/')) return problem(res, 404, 'Not found.')
  const bearer = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1]
  const user = bearer ? verifyAccessToken(bearer) : null
  if (!user) {
    return problem(res, 401, bearer ? 'The access token has expired or is not valid.' : 'Sign in first: send an access token.')
  }
  who.name = user.email

  if (method === 'GET' && path === '/api/v1/me') {
    return send(res, 200, { id: user.id, name: user.name, email: user.email, role: user.role })
  }

  // ---- a trader's applications ----
  if (path === '/api/v1/applications' && method === 'GET') {
    if (user.role !== 'trader') return problem(res, 403, 'Only traders have applications.')
    return send(res, 200, applications.filter((a) => a.traderId === user.id).map(publicApplication))
  }
  if (path === '/api/v1/applications' && method === 'POST') return createApplication(req, res, user)

  const app = /^\/api\/v1\/applications\/([^/]+)(\/submit|\/documents(?:\/([^/]+))?)?$/.exec(path)
  if (app) {
    const application = applications.find((a) => a.id === decodeURIComponent(app[1]) && a.traderId === user.id)
    // Not there, or not yours: the same answer, so nobody can probe for ids.
    if (!application) return problem(res, 404, 'Application not found.')
    if (method === 'GET' && app[2] === undefined) return send(res, 200, publicApplication(application))
    if (method === 'PUT' && app[2] === undefined) return updateApplication(req, res, application)
    if (method === 'POST' && app[2] === '/submit') return submitApplication(res, application)
    if (method === 'POST' && app[2] === '/documents') return uploadDocument(req, res, application)
    if (method === 'DELETE' && app[3] !== undefined) return removeDocument(res, application, decodeURIComponent(app[3]))
  }

  // ---- the officer's side ----
  if (path === '/api/v1/traders' && method === 'GET') return searchTraders(res, url, user)

  const one = /^\/api\/v1\/traders\/([^/]+)$/.exec(path)
  if (one && method === 'GET') {
    if (user.role !== 'officer') return problem(res, 403, 'Only a permits officer can see traders.')
    const trader = traders.find((t) => t.id === decodeURIComponent(one[1]))
    if (!trader) return problem(res, 404, 'Trader not found.')
    return send(res, 200, traderDetail(trader))
  }

  const permit = /^\/api\/v1\/permits\/([^/]+)\/(revocation-preview|revoke)$/.exec(path)
  if (permit) {
    if (user.role !== 'officer') return problem(res, 403, 'Only a permits officer can revoke a permit.')
    const trader = traders.find((t) => t.permitNumber === decodeURIComponent(permit[1]))
    if (!trader) return problem(res, 404, 'Permit not found.')
    if (method === 'GET' && permit[2] === 'revocation-preview') return revocationPreview(res, trader)
    if (method === 'POST' && permit[2] === 'revoke') return revoke(req, res, trader)
  }

  return problem(res, 404, 'Not found.')
}

async function createApplication(req, res, user) {
  if (user.role !== 'trader') return problem(res, 403, 'Only traders apply for stalls.')
  const body = await readJson(req)
  if (body === null) return problem(res, 400, 'The request body is not valid JSON.')
  const { errors, tradingName, days } = checkDetails(body)
  if (Object.keys(errors).length > 0) return validation(res, errors)

  const draft = applications.find((a) => a.traderId === user.id && a.status === 'draft')
  if (draft) {
    return problem(res, 409, 'You already have an application in progress.', { detail: `Carry on with ${draft.id} instead.`, applicationId: draft.id })
  }

  const application = {
    id: `A-${nextApplicationNumber++}`,
    traderId: user.id,
    stallTypeId: body.stallTypeId,
    tradingName,
    tradingDays: days,
    status: 'draft',
    documents: [],
    createdAt: new Date().toISOString(),
    submittedAt: null,
  }
  applications = [...applications, application]
  return send(res, 201, publicApplication(application), { Location: `/api/v1/applications/${application.id}` })
}

async function updateApplication(req, res, application) {
  if (application.status !== 'draft') return problem(res, 409, 'This application has been submitted.', { detail: 'A submitted application can no longer be changed.' })
  const body = await readJson(req)
  if (body === null) return problem(res, 400, 'The request body is not valid JSON.')
  const { errors, tradingName, days } = checkDetails(body)
  if (Object.keys(errors).length > 0) return validation(res, errors)
  application.stallTypeId = body.stallTypeId
  application.tradingName = tradingName
  application.tradingDays = days
  // A different stall type can need different documents: keep only those
  // the new type still asks for.
  const required = stallTypes.find((t) => t.id === body.stallTypeId).requiredDocuments
  application.documents = application.documents.filter((d) => required.includes(d.kind))
  return send(res, 200, publicApplication(application))
}

async function uploadDocument(req, res, application) {
  if (application.status !== 'draft') return problem(res, 409, 'This application has been submitted.', { detail: 'Documents can no longer be changed.' })
  if (control.failNextUpload) {
    control.failNextUpload = false
    return problem(res, 500, 'Something went wrong on our side.')
  }
  if (!(req.headers['content-type'] ?? '').startsWith('multipart/form-data')) {
    return problem(res, 415, 'Send the document as multipart/form-data, with the fields kind and file.')
  }
  const form = await readForm(req)
  if (form === null) return problem(res, 400, 'The form could not be read.')
  const kind = form.get('kind')
  const file = form.get('file')
  const required = stallTypes.find((t) => t.id === application.stallTypeId).requiredDocuments

  const errors = {}
  if (typeof kind !== 'string' || !required.includes(kind)) errors.kind = ['This application does not ask for that kind of document.']
  if (!(file instanceof File) || file.size === 0) errors.file = ['Choose a file.']
  else if (file.size > MAX_DOCUMENT_BYTES) errors.file = [`The file is ${megabytes(file.size)}. The limit is 2 MB.`]
  else {
    const bytes = Buffer.from(await file.arrayBuffer())
    if (sniff(bytes) === null) errors.file = ['Only PDF, JPEG or PNG files are accepted.']
  }
  if (Object.keys(errors).length > 0) return validation(res, errors)

  // The same kind again replaces the one before.
  const document = { id: `D-${nextDocumentNumber++}`, kind, fileName: file.name || 'document', sizeBytes: file.size, uploadedAt: new Date().toISOString() }
  application.documents = [...application.documents.filter((d) => d.kind !== kind), document]
  return send(res, 201, { ...document, label: documentLabels[kind] })
}

function removeDocument(res, application, documentId) {
  if (application.status !== 'draft') return problem(res, 409, 'This application has been submitted.', { detail: 'Documents can no longer be changed.' })
  const before = application.documents.length
  application.documents = application.documents.filter((d) => d.id !== documentId)
  if (application.documents.length === before) return problem(res, 404, 'Document not found.')
  res.writeHead(204)
  return res.end()
}

function submitApplication(res, application) {
  if (application.status !== 'draft') return problem(res, 409, 'This application has already been submitted.')
  const required = stallTypes.find((t) => t.id === application.stallTypeId).requiredDocuments
  const missing = required.filter((kind) => !application.documents.some((d) => d.kind === kind))
  if (missing.length > 0) {
    return problem(res, 422, 'Documents are missing.', {
      detail: `Upload ${missing.map((kind) => documentLabels[kind]).join(' and ')} first.`,
      missing: missing.map((kind) => ({ kind, label: documentLabels[kind] })),
    })
  }
  application.status = 'submitted'
  application.submittedAt = new Date().toISOString()
  return send(res, 200, publicApplication(application))
}

async function searchTraders(res, url, user) {
  if (user.role !== 'officer') return problem(res, 403, 'Only a permits officer can search traders.')
  const q = (url.searchParams.get('q') ?? '').trim()
  // StallPass: one character is too broad to be useful, so it's refused.
  if (q.length === 1) return validation(res, { q: ['Type at least 2 characters.'] })
  if (q.length > 60) return validation(res, { q: ['Searches are at most 60 characters.'] })
  // A control switch: short searches answer slowly, so an answer for "dl"
  // can arrive after the answer for "dlamini".
  if (control.slowShortSearches && q.length > 0 && q.length < 4) await sleep(1800 - q.length * 400)
  const needle = q.toLowerCase()
  const matching = traders
    .filter((t) => needle === '' || t.name.toLowerCase().includes(needle) || t.permitNumber.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))
  return send(res, 200, { items: matching.slice(0, SEARCH_LIMIT).map(traderSummary), total: matching.length })
}

function revocationPreview(res, trader) {
  if (trader.permitStatus === 'revoked') return problem(res, 409, 'This permit is already revoked.')
  const type = stallTypes.find((t) => t.id === trader.stallTypeId)
  // Calculated here, by the API, not guessed by the browser.
  return send(res, 200, {
    permitNumber: trader.permitNumber,
    traderName: trader.name,
    bookingsCancelled: trader.upcomingBookings,
    refundCents: trader.upcomingBookings * type.dayFeeCents,
    lastTradingDay: todayInSouthAfrica(),
  })
}

async function revoke(req, res, trader) {
  if (control.failNextRevoke) {
    control.failNextRevoke = false
    return problem(res, 500, 'Something went wrong on our side.')
  }
  if (trader.permitStatus === 'revoked') return problem(res, 409, 'This permit is already revoked.')
  const body = await readJson(req)
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  if (reason.length < 10 || reason.length > 300) return validation(res, { reason: ['Give the reason in 10 to 300 characters: the trader is told it.'] })
  trader.permitStatus = 'revoked'
  trader.revokedReason = reason
  trader.upcomingBookings = 0
  return send(res, 200, traderDetail(trader))
}

// ---- the control page --------------------------------------------------------

function controlAction(res, path) {
  if (path === '/_control/fail-next-upload') control.failNextUpload = true
  if (path === '/_control/fail-next-revoke') control.failNextRevoke = true
  if (path === '/_control/slow-short-searches') control.slowShortSearches = !control.slowShortSearches
  if (path === '/_control/revoke-all') {
    for (const entry of refreshTokens.values()) revokedFamilies.add(entry.family)
    control.minTokenSerial = tokenSerial + 1
  }
  if (path === '/_control/reset') {
    traders = seedTraders()
    applications = seedApplications()
    nextApplicationNumber = 2041
    nextDocumentNumber = 9003
  }
  res.writeHead(303, { Location: '/' })
  res.end()
}

const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function controlPage(res) {
  const rows = log
    .slice(-40)
    .reverse()
    .map((e) => `<tr${e.browser ? ' class="bad"' : ''}><td>${e.time}</td><td>${e.method}</td><td>${escape(e.path)}</td><td>${e.status}</td><td>${escape(e.who)}</td><td>${e.browser ? 'A BROWSER' : 'server'}</td></tr>`)
    .join('')
  const armed = (on) => (on ? ' <b>armed</b>' : '')
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>StallPass fake API</title>
<style>body{font:15px system-ui,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#1d2433}
button{font:inherit;padding:6px 12px;margin:4px 0;cursor:pointer}form{display:inline}
table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #ddd;padding:4px 6px;text-align:left}
.bad{background:#fdecea;color:#b42318;font-weight:600}code{background:#eef1f5;padding:0 4px}</style>
<h1>StallPass fake API</h1>
<p>Running on <code>http://localhost:${PORT}</code>. Access tokens last <b>${ACCESS_TOKEN_SECONDS} seconds</b>. Documents up to <b>2 MB</b>. Contract: <code>openapi.json</code>.</p>
<h2>Break something</h2>
<p><form method="post" action="/_control/fail-next-upload"><button>Next document upload answers 500</button></form>${armed(control.failNextUpload)}</p>
<p><form method="post" action="/_control/fail-next-revoke"><button>Next revoke answers 500</button></form>${armed(control.failNextRevoke)}</p>
<p><form method="post" action="/_control/slow-short-searches"><button>${control.slowShortSearches ? 'Make short searches fast again' : 'Make short searches slow'}</button></form>
(a search of 2 or 3 characters takes over a second, so it can arrive after a longer one)${armed(control.slowShortSearches)}</p>
<p><form method="post" action="/_control/revoke-all"><button>Revoke every session</button></form>
(every access and refresh token stops working now: everyone must sign in again)</p>
<p><form method="post" action="/_control/reset"><button>Reset the data</button></form> (applications and permits back to the start)</p>
<h2>Requests (newest first, reload to update)</h2>
<p>A red row means a <b>browser</b> called the API directly. In StallPass only your Next.js server should.</p>
<table><tr><th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Who</th><th>From</th></tr>${rows}</table>`)
}

// ---- the server --------------------------------------------------------------

http
  .createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
    const who = { name: '-' }
    // Node's fetch (your Next.js server) says "node"; browsers say "Mozilla/…".
    const browser = /Mozilla/.test(req.headers['user-agent'] ?? '') && url.pathname.startsWith('/api/')
    res.on('finish', () => {
      if (url.pathname === '/' || url.pathname.startsWith('/_control/') || url.pathname === '/favicon.ico') return
      const time = new Date().toLocaleTimeString('en-ZA', { hour12: false })
      log.push({ time, method: req.method, path: url.pathname + url.search, status: res.statusCode, who: who.name, browser })
      if (log.length > 200) log.shift()
      console.log(`${time}  ${req.method} ${url.pathname}${url.search}  ${res.statusCode}  ${who.name}${browser ? '  << FROM A BROWSER' : ''}`)
    })
    try {
      await handle(req, res, url, who)
    } catch (error) {
      console.error(error)
      if (!res.headersSent) problem(res, 500, 'Something went wrong on our side.')
    }
  })
  .listen(PORT, () => {
    console.log(`StallPass fake API on http://localhost:${PORT}  (access tokens last ${ACCESS_TOKEN_SECONDS}s)`)
    console.log(`Open http://localhost:${PORT} for the control page and the request log.`)
  })
