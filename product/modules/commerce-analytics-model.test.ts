import {describe,it,expect} from 'vitest'
import {practiceAnalytics,type AnalyticsEvidence} from './commerce-analytics-model'
import {createExamplePractice} from '../state/model'
import type {Payment} from './ServicesFinance'
const range={from:'2026-10-01',to:'2026-10-15'}
const payment=(id:string,clientId='marina',date='2026-10-10',amount=5000):Payment=>({id,clientId,date,amount,commission:0,serviceId:'natal',serviceName:'Natal',status:'paid'})
describe('analytics evidence',()=>{
 it('distinguishes unknown conversion and retention from zero with only paid records',()=>{
  const data=practiceAnalytics([payment('p')],createExamplePractice(),range)
  expect(data.visitToLead).toBeNull();expect(data.leadToPaid).toBeNull();expect(data.retention).toBeNull();expect(data.funnel.visits).toBeNull();expect(data.unattributed).toHaveLength(1)
 })
 it('computes repeat share from paying clients and excludes future/pending/refunded payments',()=>{
  const rows=[payment('old','marina','2026-09-01'),payment('m'),payment('d','dmitry'),payment('future','dmitry','2026-11-01'),{...payment('pending','dmitry'),status:'pending' as const},{...payment('refund'),status:'refunded' as const}]
  const data=practiceAnalytics(rows,createExamplePractice(),range)
  expect(data.paid).toHaveLength(2);expect(data.repeatShare).toBe(.5);expect(data.averageOrder).toBe(5000)
 })
 it('requires coverage, exact receipts and chronological visitor steps for source conversion',()=>{
  const evidence:AnalyticsEvidence={coverage:range,cohorts:[],events:[
   {id:'v',visitorId:'a',at:'2026-10-02',source:'Telegram',kind:'visit'},
   {id:'l',visitorId:'a',at:'2026-10-03',source:'Telegram',kind:'lead'},
   {id:'p',visitorId:'a',at:'2026-10-10',source:'Telegram',kind:'paid',paymentId:'p',clientId:'marina'},
   {id:'fake',visitorId:'b',at:'2026-10-10',source:'Telegram',kind:'paid',paymentId:'unknown',clientId:'marina'},
   {id:'wrong',visitorId:'c',at:'2026-10-10',source:'Telegram',kind:'paid',paymentId:'p',clientId:'dmitry'},
   {id:'early',visitorId:'d',at:'2026-10-01',source:'Direct',kind:'lead'},
   {id:'late',visitorId:'d',at:'2026-10-04',source:'Direct',kind:'visit'}]}
  const telegram=practiceAnalytics([payment('p')],createExamplePractice(),range,evidence,'Telegram')
  expect(telegram.funnel.paid).toBe(1);expect(telegram.leadToPaid).toBe(1);expect(telegram.sourcePayments).toHaveLength(1)
  expect(practiceAnalytics([payment('p')],createExamplePractice(),range,evidence,'Direct').visitToLead).toBe(0)
  expect(practiceAnalytics([payment('p')],createExamplePractice(),range,{...evidence,coverage:{from:'2026-10-05',to:range.to}}).visitToLead).toBeNull()
 })
 it('uses supplied mature subscription cohorts, ignoring impossible renewal counts',()=>{
  const data=practiceAnalytics([],createExamplePractice(),range,{events:[],cohorts:[{id:'c',periodEnd:'2026-10-10',eligible:4,renewed:3},{id:'bad',periodEnd:'2026-10-10',eligible:2,renewed:3},{id:'future',periodEnd:'2026-11-10',eligible:10,renewed:10}]})
  expect(data.retention).toBe(.75);expect(data.eligible).toBe(4)
 })
})
