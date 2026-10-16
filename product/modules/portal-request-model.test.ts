import {describe,it,expect} from 'vitest'
import {acceptPortalRequest,rejectPortalRequest,cancelAcceptedRequest} from './portal-request-model'
import {createPortalOrder} from './portal-order-model'
import {commerceDefaults} from '../state/commerce-model'
import {createExamplePractice} from '../state/model'
import type {Service} from './ServicesFinance'
const base:Service={id:'natal',name:'Consultation',description:'Read',duration:60,price:5000,includes:['Notes'],status:'available',commerce:commerceDefaults(5000)}
const now=new Date('2026-10-16T06:00:00Z')
function liveOrder(){return {...createPortalOrder(base,[],{},'marina'),appointment:{id:'request-booking',date:'2026-10-19',time:'12:00',duration:60,timeZone:'Europe/Moscow'}}}
describe('specialist request review',()=>{
 it('accepts a package without creating a one-off appointment, payment or access',()=>{
  const practice=createExamplePractice(),order=createPortalOrder({...base,commerce:{...base.commerce!,sale:'pack'}},[],{},'marina')
  const result=acceptPortalRequest(order,practice,now)
  expect(result.practice).toBe(practice);expect(result.order.status).toBe('accepted');expect(result.order.preparation).toBe('not-started');expect(result.order).not.toHaveProperty('paid');expect(result.order).not.toHaveProperty('accessUntil');expect(order.status).toBe('requested')
 })
 it('accepts a live request as exactly one linked appointment with agreed snapshot price',()=>{
  const practice=createExamplePractice(),order=liveOrder(),result=acceptPortalRequest(order,practice,now)
  const added=result.practice.appointments.find(a=>a.id===order.appointment.id)
  expect(result.practice.appointments).toHaveLength(practice.appointments.length+1)
  expect(added).toMatchObject({clientId:'marina',status:'confirmed',price:5000,date:'2026-10-19',time:'12:00'})
  expect(()=>acceptPortalRequest(result.order,result.practice,now)).toThrow();expect(practice.appointments.some(a=>a.id===order.appointment.id)).toBe(false)
 })
 it('accepts the first package slot without replacing the package terms or claiming all meetings were delivered',()=>{
  const practice=createExamplePractice(),service={...base,price:12000,commerce:{...base.commerce!,sale:'pack' as const,packCount:3,unitPrice:4000}}
  const order={...createPortalOrder(service,[],{},'marina'),appointment:liveOrder().appointment}
  service.price=20000;service.commerce.packCount=5
  const result=acceptPortalRequest(order,practice,now)
  expect(result.practice.appointments).toHaveLength(practice.appointments.length+1)
  expect(result.practice.appointments.at(-1)).toMatchObject({id:order.appointment.id,clientId:'marina',price:12000,status:'confirmed'})
  expect(result.order).toMatchObject({total:12000,commerce:{sale:'pack',packCount:3},status:'accepted'})
  expect(result.order).not.toHaveProperty('paid');expect(result.order).not.toHaveProperty('accessUntil')
  expect(()=>acceptPortalRequest(result.order,result.practice,now)).toThrow()
  const cancelled=cancelAcceptedRequest({...result.order,status:'cancellation-requested'},result.practice)
  expect(cancelled.practice.appointments.at(-1)?.status).toBe('cancelled')
  expect(cancelled.order.commerce.packCount).toBe(3)
 })
 it('rejects a conflicting or elapsed time without altering the request',()=>{
  const practice=createExamplePractice(),order=liveOrder()
  const busy={...practice,appointments:[...practice.appointments,{id:'busy',clientId:'dmitry',date:order.appointment.date,time:'12:30',duration:60,title:'Other',status:'confirmed' as const}]}
  expect(()=>acceptPortalRequest(order,busy,now)).toThrow();expect(order.status).toBe('requested')
  expect(()=>acceptPortalRequest(order,practice,new Date('2026-10-20T00:00:00Z'))).toThrow()
 })
 it('prevents accepting orders for an unknown client or fabricated subscription appointment',()=>{
  expect(()=>acceptPortalRequest({...liveOrder(),clientId:'unknown'},createExamplePractice(),now)).toThrow()
  const order=liveOrder();order.commerce.sale='subscription';expect(()=>acceptPortalRequest(order,createExamplePractice(),now)).toThrow()
 })
 it('keeps a reason for decline and keeps history, without changing calendar',()=>{
  const order=liveOrder();expect(()=>rejectPortalRequest(order,' ')).toThrow()
  const rejected=rejectPortalRequest(order,'No availability')
  expect(rejected).toMatchObject({status:'rejected',decisionNote:'No availability',total:5000});expect(order.status).toBe('requested')
 })
 it('confirms a cancellation only after a client request, keeping appointment history',()=>{
  const result=acceptPortalRequest(liveOrder(),createExamplePractice(),now)
  expect(()=>cancelAcceptedRequest(result.order,result.practice)).toThrow()
  const cancelled=cancelAcceptedRequest({...result.order,status:'cancellation-requested'},result.practice)
  expect(cancelled.order.status).toBe('cancelled');expect(cancelled.practice.appointments.find(a=>a.id===result.order.appointment?.id)?.status).toBe('cancelled');expect(cancelled.practice.appointments).toHaveLength(result.practice.appointments.length)
 })
})
