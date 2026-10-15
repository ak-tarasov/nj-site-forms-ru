// What a request may contain and the letter it becomes.
export const kinds = { call: 'Перезвонить', task: 'Задача' }
const labels = [['name', 'Имя'], ['phone', 'Телефон'], ['time', 'Когда удобно'], ['contact', 'Телефон или почта'], ['city', 'Город'], ['about', 'Задача'], ['page', 'Страница']]

export function letter(lead) {
  const lines = labels.filter(([k]) => lead[k]).map(([k, label]) => `${label}: ${lead[k]}`)
  return {
    subject: `Заявка с сайта: ${kinds[lead.kind]} — ${lead.name}`,
    text: [`Заявка с сайта ru.nj-design.pro (${kinds[lead.kind].toLowerCase()}).`, '', ...lines, '', `Согласие на обработку персональных данных: дано ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (МСК).`].join('\n'),
    replyTo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.contact ?? '') ? lead.contact : undefined,
  }
}

export function clean(raw) {
  const lead = Object.fromEntries(labels.map(([k]) => k).concat('kind').filter((k) => typeof raw[k] === 'string' && raw[k].trim()).map((k) => [k, raw[k].trim().slice(0, 3000)]))
  const ok = kinds[lead.kind] && lead.name && (lead.phone || lead.contact) && raw.consent === 'yes'
  return ok ? lead : null
}
