import {describe,it,expect} from 'vitest'
import {serviceIncomeSummary} from './service-income-model'
import type {Payment} from './ServicesFinance'
const payment=(extra:Partial<Payment>):Payment=>({id:'p',clientId:'c',serviceId:'a',serviceName:'Услуга A',date:'2026-10-15',amount:1000,commission:100,status:'paid',...extra})
describe('service income ranking',()=>{
 it('ranks net income, retains order counts and excludes unpaid/refunded orders',()=>{
  const rows=serviceIncomeSummary([payment({}),payment({id:'2'}),payment({serviceId:'b',serviceName:'Услуга B',amount:3000,commission:300}),payment({amount:99999,status:'pending'}),payment({amount:99999,status:'refunded'})])
  expect(rows.map(r=>[r.id,r.count,r.amount,r.leading])).toEqual([['b',1,2700,true],['a',2,1800,false]])
  expect(rows.map(r=>r.share)).toEqual([60,40])
 })
 it('retains historical services independently of the current catalog and handles ties',()=>{
  expect(serviceIncomeSummary([payment({serviceId:'archived'}),payment({serviceId:'current'})]).every(r=>r.leading)).toBe(true)
 })
 it('does not invent percentages or a leading service for zero income',()=>{
  expect(serviceIncomeSummary([payment({amount:0,commission:0})])[0]).toMatchObject({amount:0,share:null,leading:false})
  expect(serviceIncomeSummary([])).toEqual([])
 })
})
