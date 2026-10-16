import {describe,expect,it} from 'vitest'
import type {Appointment} from './model'
import type {Payment} from '../modules/ServicesFinance'
import {synchronizeAppointmentPayments,visibleAppointmentPayment} from './appointmentPayments'

const today='2026-10-15'
const meeting:Appointment={id:'meeting-a',clientId:'client-a',title:'Консультация',date:'2026-10-20',time:'12:00',duration:60,status:'confirmed',price:4900,serviceId:'natal'}
const paid:Payment={id:'existing',appointmentId:meeting.id,clientId:meeting.clientId,serviceId:'natal',serviceName:'Консультация',date:'2026-10-01',amount:4000,commission:160,status:'paid'}

describe('appointments to payment requests',()=>{
 it('creates a request for a priced future meeting, visible from the day it is created',()=>{
  const result=synchronizeAppointmentPayments([], [meeting], today)
  expect(result).toHaveLength(1)
  expect(result[0]).toMatchObject({appointmentId:meeting.id,clientId:meeting.clientId,amount:4900,commission:0,date:today,status:'pending'})
 })
 it('does not duplicate requests after reload or rescheduling; updates only unpaid generated conditions',()=>{
  const created=synchronizeAppointmentPayments([], [meeting], today)
  const reloaded=JSON.parse(JSON.stringify(created)) as Payment[]
  const result=synchronizeAppointmentPayments(reloaded,[{...meeting,date:'2026-10-22',price:5900,title:'Другая консультация'}], '2026-10-16')
  expect(result).toHaveLength(1)
  expect(result[0]).toMatchObject({id:created[0].id,date:today,amount:5900,serviceName:'Другая консультация'})
  expect(synchronizeAppointmentPayments(result,[{...meeting,date:'2026-10-22',price:5900,title:'Другая консультация'}],today)).toBe(result)
 })
 it('preserves received and refunded payment records even when meeting conditions change',()=>{
  for(const status of ['paid','refunded'] as const){
   const existing={...paid,status}
   expect(synchronizeAppointmentPayments([existing],[{...meeting,price:9900,status:'cancelled'}],today)).toEqual([existing])
  }
 })
 it('does not create requests for free, unpriced or cancelled meetings',()=>{
  expect(synchronizeAppointmentPayments([],[{...meeting,id:'free',price:0},{...meeting,id:'unknown',price:undefined},{...meeting,id:'cancelled',status:'cancelled'}],today)).toEqual([])
 })
 it('hides unpaid cancelled meetings and restores the same request when restored, while keeping received money visible',()=>{
  const requests=synchronizeAppointmentPayments([], [meeting], today)
  const cancelled={...meeting,status:'cancelled' as const}
  expect(visibleAppointmentPayment(requests[0],[cancelled])).toBe(false)
  expect(visibleAppointmentPayment(paid,[cancelled])).toBe(true)
  const restored=synchronizeAppointmentPayments(requests,[meeting],today)
  expect(restored).toHaveLength(1)
  expect(restored[0].id).toBe(requests[0].id)
  expect(visibleAppointmentPayment(restored[0],[meeting])).toBe(true)
 })
 it('preserves exact historical links and avoids duplicating legacy seeded payments',()=>{
  const {appointmentId:_,...legacy}=paid
  const result=synchronizeAppointmentPayments([legacy],[meeting],today,[paid])
  expect(result).toHaveLength(1)
  expect(result[0]).toEqual(paid)
 })
 it('does not guess meeting links from client, day or amount',()=>{
  const unrelated={...paid,id:'unrelated',appointmentId:undefined}
  const result=synchronizeAppointmentPayments([unrelated],[meeting],today,[paid])
  expect(result).toHaveLength(2)
  expect(result[0]).toEqual(unrelated)
 })
 it('hides a generated unpaid request when the meeting becomes free without erasing historical payments',()=>{
  const [request]=synchronizeAppointmentPayments([], [meeting], today)
  expect(visibleAppointmentPayment(request,[{...meeting,price:0}])).toBe(false)
  expect(visibleAppointmentPayment(paid,[{...meeting,price:0}])).toBe(true)
 })
})
