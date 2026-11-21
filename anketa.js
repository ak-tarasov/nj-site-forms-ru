// The questionnaire of Eugenia Tarasova's site. Its inputs have no names, so the page sends label/value pairs as they are;
// the letter goes to her mailbox, not to ours, and is not counted in /pending.
export const anketaSites = ['eugeniatarasova.pro', 'xn--80aaafcdmc1a3cowok8q.xn--p1ai'].flatMap((d) => [`https://${d}`, `https://www.${d}`])
  .concat('https://eugeniatarasova.github.io', 'https://eugeniatarasova-preview-q7m2-1de8.twc1.net')

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function anketaLetter(raw) {
  if (raw.consent !== 'yes' || !Array.isArray(raw.fields)) return null
  const fields = raw.fields.slice(0, 30).map((f) => [str(f?.label, 200), str(f?.value, 3000)]).filter(([l, v]) => l && v)
  if (!fields.length) return null
  const name = fields[0][1].slice(0, 60)
  return {
    subject: `Анкета с сайта: ${name}`,
    text: ['Новая анкета с сайта eugeniatarasova.pro.', '', ...fields.map(([l, v]) => `${l}: ${v}`), '',
      `Согласие на обработку персональных данных: дано ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (МСК).`].join('\n'),
  }
}
