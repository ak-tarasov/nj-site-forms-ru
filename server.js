// Request forms of the Russian page. A request is mailed to the Yandex mailbox (SMTP) and not stored here, so the data of
// Russian visitors stays in Russia (Timeweb + Yandex). The lead poller on Aleksey's side asks GET /pending for how many
// requests came (no personal data) and clears them with DELETE /pending?seq=N after the Telegram note.
import { createServer } from 'node:http'
import { clean, letter } from './lead.js'
import { sendMail } from './smtp.js'

const env = process.env
// The pool-building site «Бассейны у моря» sends its requests here too; its addresses are fixed, so they live in code.
const poolSochi = ['basseyny-u-morya.ru', 'basseynyumorya.ru', 'xn--80abnqpfiqdaz9gqc.xn--p1ai'].flatMap((d) => [`https://${d}`, `https://www.${d}`])
const origins = (env.ALLOWED_ORIGINS ?? 'https://ru.nj-design.pro').split(',').concat(poolSochi)
let seq = 0
let pending = [] // { seq, kind } — counts only
const recent = new Map() // ip → times of the last requests, against floods

function reply(res, status, data, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...(origins.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' } : {}),
  })
  res.end(JSON.stringify(data))
}

function tooMany(ip) {
  const now = Date.now()
  const times = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000)
  times.push(now)
  recent.set(ip, times)
  return times.length > 5
}

async function readBody(req) {
  let body = ''
  for await (const chunk of req) {
    body += chunk
    if (body.length > 10000) throw new Error('too big')
  }
  return JSON.parse(body)
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin ?? ''
  const url = new URL(req.url, 'http://x')
  try {
    if (req.method === 'OPTIONS') return reply(res, 204, {}, origin)
    if (url.pathname === '/lead' && req.method === 'POST') {
      const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress).split(',')[0].trim()
      const raw = await readBody(req)
      if (raw.website) return reply(res, 200, { ok: true }, origin) // spam trap filled in
      if (tooMany(ip)) return reply(res, 429, { ok: false }, origin)
      const lead = clean(raw)
      if (!lead) return reply(res, 400, { ok: false }, origin)
      await sendMail({ host: env.SMTP_HOST ?? 'smtp.yandex.ru', user: env.SMTP_USER, pass: env.SMTP_PASS, to: env.MAIL_TO ?? env.SMTP_USER, ...letter(lead, origin) })
      pending.push({ seq: ++seq, kind: lead.kind })
      return reply(res, 200, { ok: true }, origin)
    }
    if (url.pathname === '/pending') {
      if (!env.POLL_TOKEN || req.headers.authorization !== `Bearer ${env.POLL_TOKEN}`) return reply(res, 401, { ok: false })
      if (req.method === 'DELETE') pending = pending.filter((p) => p.seq > Number(url.searchParams.get('seq')))
      const count = (k) => pending.filter((p) => p.kind === k).length
      return reply(res, 200, { count: pending.length, kinds: { call: count('call'), task: count('task') }, seq })
    }
    if (url.pathname === '/health') return reply(res, 200, { ok: true })
    reply(res, 404, { ok: false }, origin)
  } catch (e) {
    console.error(new Date().toISOString(), req.method, url.pathname, e.message)
    reply(res, 500, { ok: false }, origin)
  }
})

// App Platform sends traffic to port 8080 on all interfaces.
server.listen(Number(env.PORT ?? 8080), '0.0.0.0', () => console.log('listening', env.PORT ?? 8080))
