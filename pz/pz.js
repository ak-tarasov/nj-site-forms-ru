// The pool calculation program lives behind these forms: everything that is not a form address is passed to it.
// It is a Python program (private repo ak-tarasov/pool-pz) that pz/start.sh fetches and runs on 127.0.0.1:8766;
// its data goes back to a private repo every minute (pz/sync.sh), since a new deploy starts with an empty disk.
import { execFile, spawn } from 'node:child_process'
import { request } from 'node:http'
import { fileURLToPath } from 'node:url'

const here = (name) => fileURLToPath(new URL(name, import.meta.url))
const PORT = 8766
let child = null
let stopping = false

export function startProgram() {
  if (!process.env.PZ_KEY_APP) return
  child = spawn('sh', [here('./start.sh')], { stdio: 'inherit' })
  child.on('exit', (code) => {
    child = null
    if (stopping) return
    console.error(new Date().toISOString(), 'pz exited', code, '- restarting in 30 s')
    setTimeout(startProgram, 30_000)
  })
}

export function saveData() {
  return new Promise((done) =>
    execFile('sh', [here('./sync.sh')], { timeout: 60_000 }, (err, _out, errText) => {
      if (err) console.error(new Date().toISOString(), 'pz sync failed', errText || err.message)
      done()
    }),
  )
}

if (process.env.PZ_KEY_APP) setInterval(saveData, 60_000).unref()

/** Saves the data and stops the program before the server goes away (a new deploy sends SIGTERM). */
export async function stopProgram() {
  stopping = true
  await saveData()
  child?.kill()
}

const WAIT_PAGE = '<!doctype html><meta charset="utf-8"><title>Расчёт бассейна</title><p style="font:18px sans-serif;margin:3em">Программа запускается, обновите страницу через минуту.</p>'

export function proxy(req, res) {
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress).split(',')[0].trim()
  const upstream = request(
    { host: '127.0.0.1', port: PORT, method: req.method, path: req.url, headers: { ...req.headers, 'x-forwarded-for': ip } },
    (answer) => {
      res.writeHead(answer.statusCode ?? 502, answer.headers)
      answer.pipe(res)
    },
  )
  upstream.on('error', () => {
    if (res.headersSent) return res.destroy()
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '30' })
    res.end(WAIT_PAGE)
  })
  req.pipe(upstream)
}
