import {afterEach,describe,it,expect,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {PracticeInsights} from './PracticeInsights'
import {createExamplePractice} from '../state/model'
import type {Payment} from '../modules/ServicesFinance'
import {setLocale} from '../i18n'

afterEach(()=>{vi.unstubAllGlobals();setLocale('ru')})
describe('practice summaries',()=>{
 it('preserves empty states without manufactured chart slices or percentages',()=>{
  setLocale('en')
  vi.stubGlobal('window',{location:{href:'http://localhost/product/#dashboard'}})
  const practice=createExamplePractice();practice.clients=[]
  const html=renderToStaticMarkup(<PracticeInsights practice={practice} payments={[]} from="2026-10-01" to="2026-10-15"/>)
  expect(html).toContain('No paid services this month yet.')
  expect(html).toContain('The breakdown appears when clients are added.')
  expect(html).not.toContain('strokeDash')
  expect(html).not.toMatch(/NaN|Infinity/)
 })
 it('shows four leaders but calculates their share against every paid service',()=>{
  setLocale('en')
  vi.stubGlobal('window',{location:{href:'http://localhost/product/#dashboard'}})
  const practice=createExamplePractice();practice.clients[0].stage='active'
  const payments=Array.from({length:5},(_,i)=>({id:String(i),serviceId:String(i),serviceName:`Service ${i}`,clientId:'marina',amount:100,commission:0,status:'paid',date:'2026-10-10'} as Payment))
  const html=renderToStaticMarkup(<PracticeInsights practice={practice} payments={payments} from="2026-10-01" to="2026-10-15"/>)
  expect(html.match(/20%/g)).toHaveLength(4)
  expect(html).not.toContain('25%')
  expect(html).not.toContain('Service 4')
  expect(html).toContain('clientStage=active')
 })
})
