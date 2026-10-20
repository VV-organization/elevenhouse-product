import {describe,it,expect} from 'vitest'
import {monthlyIncomeComparison,clientStageSummary} from './practice-insights-model'
import {createExamplePractice} from '../state/model'
import type {Payment} from '../modules/ServicesFinance'

const receipt=(patch:Partial<Payment>={}):Payment=>({id:'p',clientId:'marina',serviceId:'natal',serviceName:'Natal',amount:5000,commission:200,date:'2026-10-01',status:'paid',...patch} as Payment)
describe('dashboard comparison uses recorded receipts',()=>{
 it('compares equivalent calendar days and ignores future, pending and refunded receipts',()=>{
  const data=monthlyIncomeComparison([
   receipt({id:'old',date:'2026-09-10',amount:10000,commission:400}),
   receipt({date:'2026-09-20',receivedDate:'2026-10-10'}),
   receipt({id:'outside',date:'2026-09-16'}),
   receipt({id:'future',date:'2026-10-16'}),
   receipt({id:'pending',status:'pending'}),
   receipt({id:'refund',status:'refunded'}),
  ],'2026-10-15')
  expect([data.previousFrom,data.previousTo]).toEqual(['2026-09-01','2026-09-15'])
  expect(data.currentNet).toBe(4800)
  expect(data.previousNet).toBe(9600)
  expect(data.change).toBe(-.5)
 })
 it('does not invent a growth percentage when the baseline is zero',()=>{
  expect(monthlyIncomeComparison([receipt()],'2026-10-15').change).toBeNull()
  expect(monthlyIncomeComparison([],'2026-10-15').currentNet).toBe(0)
 })
 it('handles a shorter previous month and leap years without rolling into March',()=>{
  const normal=monthlyIncomeComparison([],'2026-03-31')
  expect(normal.previousTo).toBe('2026-02-28')
  expect(normal.sameDays).toBe(false)
  expect(normal.change).toBeNull()
  expect(monthlyIncomeComparison([],'2024-03-31').previousTo).toBe('2024-02-29')
  expect(monthlyIncomeComparison([],'2026-01-15').previousFrom).toBe('2025-12-01')
 })
})
describe('client breakdown',()=>{
 it('accounts for unset, custom and legacy stages exactly once',()=>{
  const practice=createExamplePractice(),client=practice.clients[0]
  practice.clientStages=[{id:'vip',label:'VIP'}]
  practice.clients=[undefined,'active','active','vip','legacy'].map((stage,i)=>({...client,id:String(i),stage}))
  const stages=clientStageSummary(practice,[['','No stage'],['new','New'],['active','Active']])
  expect(stages.map(s=>[s.id,s.count])).toEqual([['',1],['new',0],['active',2],['vip',1],['legacy',1]])
  expect(stages.reduce((sum,s)=>sum+s.count,0)).toBe(practice.clients.length)
 })
})
