// Minimal SMTP client over TLS (port 465, AUTH PLAIN): one letter per call, no dependencies.
import { connect } from 'node:tls'

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64')
const header = (s) => `=?UTF-8?B?${b64(s)}?=`

export function sendMail({ host, port = 465, user, pass, to, subject, text, replyTo }) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port, servername: host, timeout: 20000 })
    const steps = [
      [220, () => `EHLO nj-design.pro`],
      [250, () => `AUTH PLAIN ${b64(`\0${user}\0${pass}`)}`],
      [235, () => `MAIL FROM:<${user}>`],
      [250, () => `RCPT TO:<${to}>`],
      [250, () => 'DATA'],
      [354, () => [
        `From: ${header('Сайт NJ-Design')} <${user}>`,
        `To: <${to}>`,
        ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
        `Subject: ${header(subject)}`,
        `Date: ${new Date().toUTCString()}`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        b64(text).replace(/.{76}/g, '$&\r\n'),
        '.',
      ].join('\r\n')],
      [250, () => 'QUIT'],
    ]
    let buffer = ''
    socket.setEncoding('utf8')
    socket.on('timeout', () => socket.destroy(new Error('smtp timeout')))
    socket.on('error', reject)
    socket.on('data', (chunk) => {
      buffer += chunk
      // A reply is complete when its last line has a space after the code ("250 ok", not "250-...").
      const lines = buffer.split('\r\n').filter(Boolean)
      const last = lines.at(-1)
      if (!buffer.endsWith('\r\n') || !/^\d{3} /.test(last)) return
      buffer = ''
      const code = Number(last.slice(0, 3))
      const step = steps.shift()
      if (!step) return
      if (code !== step[0]) {
        socket.destroy()
        return reject(new Error(`smtp ${code}: ${last.slice(4, 120)}`))
      }
      socket.write(step[1]() + '\r\n')
      if (!steps.length) {
        socket.end()
        resolve()
      }
    })
  })
}
