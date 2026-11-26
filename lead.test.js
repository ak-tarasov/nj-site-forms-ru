import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clean, letter } from './lead.js'

const base = { kind: 'task', name: 'Иван', contact: 'ivan@example.com', about: 'Бассейн 10×4', consent: 'yes' }

test('NJ-Design pages need both ticks', () => {
  for (const origin of ['https://ru.nj-design.pro', 'https://nj-design.pro']) {
    assert.equal(clean(base, origin), null)
    assert.equal(clean({ ...base, policy: 'yes', consent: 'no' }, origin), null)
    assert.ok(clean({ ...base, policy: 'yes' }, origin))
  }
})

test('other sites keep the single consent tick', () => {
  assert.ok(clean(base, 'https://basseyny-u-morya.ru'))
  assert.equal(clean({ ...base, consent: undefined }, 'https://basseyny-u-morya.ru'), null)
})

test('the letter records both ticks and the site', () => {
  const mail = letter(clean({ ...base, policy: 'yes', lang: 'en' }, 'https://nj-design.pro'), 'https://nj-design.pro')
  assert.match(mail.subject, /nj-design\.pro/)
  assert.match(mail.text, /Согласие на обработку персональных данных: дано/)
  assert.match(mail.text, /ознакомлен\(а\): да/)
  assert.match(mail.text, /Язык страницы: en/)
})
