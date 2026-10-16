import {afterEach,describe,it,expect} from 'vitest'
import {setLocale} from '../i18n'
import {commerceDefaults} from '../state/commerce-model'
import {serviceSummary,sessionCount,requestCountLabel} from './commerce-copy'
afterEach(()=>setLocale('ru'))
describe('commerce summaries preserve the sales unit',()=>{
 it('labels package duration per session and price for the whole package',()=>{
  expect(serviceSummary({price:15000,duration:60,commerce:{...commerceDefaults(),sale:'pack',packCount:3}}).replace(/\s/g,' ')).toBe('3 встречи по 60 мин · 15 000 ₽')
 })
 it('shows subscription billing period instead of implying a single paid appointment',()=>{
  expect(serviceSummary({price:5000,duration:60,commerce:{...commerceDefaults(),sale:'subscription',period:'month'}}).replace(/\s/g,' ')).toBe('Подписка · 5 000 ₽ / месяц')
 })
 it('declines Russian quantities correctly',()=>{
  expect([1,3,5,21].map(sessionCount)).toEqual(['1 встреча','3 встречи','5 встреч','21 встреча'])
  expect([1,2,11].map(requestCountLabel)).toEqual(['1 заявка','2 заявки','11 заявок'])
 })
 it('uses English singular and plural when language changes',()=>{
  setLocale('en');expect(sessionCount(1)).toBe('1 session');expect(requestCountLabel(3)).toBe('3 requests')
  expect(serviceSummary({price:15000,duration:60,commerce:{...commerceDefaults(),sale:'pack',packCount:3}})).toContain('3 sessions × 60 min')
 })
})
