// What a request may contain and the letter it becomes.
export const kinds = { call: 'Перезвонить', task: 'Задача' }
const labels = [['name', 'Имя'], ['phone', 'Телефон'], ['time', 'Когда удобно'], ['contact', 'Телефон или почта'], ['city', 'Город'], ['about', 'Задача'], ['lang', 'Язык страницы'], ['page', 'Страница']]
/** NJ-Design pages ask for two separate ticks (152-FZ): consent to processing, and having read the policy. */
const njDesign = ['https://ru.nj-design.pro', 'https://nj-design.pro']

export function letter(lead, origin = '') {
  const site = new URL(origin || 'https://ru.nj-design.pro').hostname.replace('xn--80abnqpfiqdaz9gqc.xn--p1ai', 'бассейныуморя.рф')
  const lines = labels.filter(([k]) => lead[k]).map(([k, label]) => `${label}: ${lead[k]}`)
  return {
    subject: `Заявка с ${site}: ${kinds[lead.kind]} — ${lead.name}`,
    text: [
      `Заявка с сайта ${site} (${kinds[lead.kind].toLowerCase()}).`,
      '',
      ...lines,
      '',
      `Согласие на обработку персональных данных: дано ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} (МСК).`,
      ...(lead.policy ? ['С Политикой обработки персональных данных ознакомлен(а): да.'] : []),
    ].join('\n'),
    replyTo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.contact ?? '') ? lead.contact : undefined,
  }
}

/** The request as it goes into the letter, or null when something required is missing (both ticks on NJ-Design pages). */
export function clean(raw, origin = '') {
  const lead = Object.fromEntries(labels.map(([k]) => k).concat('kind').filter((k) => typeof raw[k] === 'string' && raw[k].trim()).map((k) => [k, raw[k].trim().slice(0, 3000)]))
  const policyNeeded = njDesign.includes(origin)
  const ok = kinds[lead.kind] && lead.name && (lead.phone || lead.contact) && raw.consent === 'yes' && (!policyNeeded || raw.policy === 'yes')
  return ok ? { ...lead, ...(raw.policy === 'yes' ? { policy: 'yes' } : {}) } : null
}
