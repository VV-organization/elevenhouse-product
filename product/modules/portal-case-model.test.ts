import {describe,it,expect} from 'vitest'
import {createClientCase,reviewClientCase} from './portal-case-model'
import {createPortalOrder} from './portal-order-model'
import {commerceDefaults} from '../state/commerce-model'
import type {Payment,Service} from './ServicesFinance'
const service:Service={id:'s',name:'Service',description:'',includes:['Result'],duration:60,price:5000,status:'available',commerce:commerceDefaults(5000)}
const order={...createPortalOrder(service,[],{},'marina'),appointment:{id:'a',date:'2026-10-10',time:'12:00',duration:60,timeZone:'Europe/Moscow'}}
const payment:Payment={id:'p',clientId:'marina',appointmentId:'a',serviceId:'s',serviceName:'Service',date:'2026-10-10',amount:5000,commission:0,status:'paid'}
const input={clientId:'marina',orderId:order.id,paymentId:payment.id,kind:'refund' as const,reason:'quality',description:'The report was incomplete',amount:2000}
describe('client issues and refund requests',()=>{
 it('creates a linked request without modifying the payment, freezing money or sending',()=>{const item=createClientCase(input,[order],[payment],[]);expect(item).toMatchObject({status:'prepared',amount:2000,orderId:order.id,paymentId:'p'});expect(payment.status).toBe('paid');expect(item).not.toHaveProperty('sentAt');expect(item).not.toHaveProperty('refunded')})
 it('rejects foreign, unrelated, unpaid, oversized and duplicate refund requests',()=>{
  expect(()=>createClientCase({...input,clientId:'other'},[order],[payment],[])).toThrow()
  expect(()=>createClientCase(input,[order],[{...payment,appointmentId:'different'}],[])).toThrow()
  expect(()=>createClientCase(input,[order],[{...payment,status:'pending'}],[])).toThrow()
  expect(()=>createClientCase({...input,amount:5001},[order],[payment],[])).toThrow()
  const item=createClientCase(input,[order],[payment],[]);expect(()=>createClientCase(input,[order],[payment],[item])).toThrow()
 })
 it('supports an order issue without a payment, but not a refund without paid evidence',()=>{
  expect(createClientCase({...input,paymentId:undefined,kind:'dispute'},[order],[],[]).amount).toBeUndefined()
  expect(()=>createClientCase({...input,paymentId:undefined},[order],[],[])).toThrow()
 })
 it('links a package refund by exact order ID without inventing an appointment',()=>{
  const pack={...order,appointment:undefined,commerce:{...order.commerce,sale:'pack' as const}},receipt={...payment,appointmentId:undefined,orderId:order.id}
  expect(createClientCase(input,[pack],[receipt],[]).paymentId).toBe('p')
  expect(()=>createClientCase(input,[pack],[{...receipt,orderId:'other'}],[])).toThrow()
 })
 it('requires a reasoned response and does not allow editing a closed case',()=>{
  const item=createClientCase(input,[order],[payment],[]);expect(()=>reviewClientCase(item,'')).toThrow()
  const reviewed=reviewClientCase(item,'Agreed to clarify the report',true);expect(reviewed.status).toBe('resolved');expect(()=>reviewClientCase(reviewed,'More')).toThrow();expect(payment.status).toBe('paid')
 })
})
