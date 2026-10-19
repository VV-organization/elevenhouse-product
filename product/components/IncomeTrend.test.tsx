import {afterEach,describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {IncomeTrend} from './IncomeTrend'
import {setLocale} from '../i18n'
afterEach(()=>setLocale('ru'))
describe('income comparison values',()=>{
 it('labels both actual dates rather than giving the previous payment the current date',()=>{
  setLocale('en')
  const html=renderToStaticMarkup(<IncomeTrend points={[{date:'2026-10-02',amount:4704}]} from="2026-10-01" to="2026-10-03" comparison={{points:[{date:'2026-09-29',amount:8544}],from:'2026-09-28',to:'2026-09-30'}}/>).replace(/\u00a0/g,' ')
  expect(html).toMatch(/aria-label="2 Oct:.*4[ ,]704.*previous period 29 Sept:.*8[ ,]544/)
  expect(html).toContain('Compared by day within each period')
 })
 it('keeps previous income visible when the selected period is empty',()=>{
  setLocale('en')
  const html=renderToStaticMarkup(<IncomeTrend points={[]} from="2026-10-01" to="2026-10-03" comparison={{points:[{date:'2026-09-29',amount:8544}],from:'2026-09-28',to:'2026-09-30'}}/>)
  expect(html).not.toContain('No income in the selected periods')
  expect(html).toContain('previous period 29 Sept:')
 })
 it('handles empty or invalid ranges without manufactured values',()=>{
  setLocale('en')
  for(const [from,to] of [['2026-10-01','2026-10-03'],['2026-10-03','2026-10-01']]){
   const html=renderToStaticMarkup(<IncomeTrend points={[]} from={from} to={to}/>)
   expect(html).toContain('No income in the selected periods')
   expect(html).not.toContain('NaN')
  }
 })
})
