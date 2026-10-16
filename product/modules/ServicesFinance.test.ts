import { createMemberPractice, memberPayments } from '../state/memberCore'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SERVICES, markPaymentReceived, undoPaymentReceipt, paymentDate, paymentAppointment, paymentTotals, uniqueIncludes, type Payment } from './ServicesFinance'
describe('catalog composition', () => {
 it('deduplicates case, whitespace and final punctuation without removing distinct results', () => {
  expect(uniqueIncludes(' Онлайн-встреча\nонлайн-встреча.\n\nПисьменное резюме\nЗапись встречи')).toEqual(['онлайн-встреча.', 'Письменное резюме', 'Запись встречи'])
 })
 it('keeps preview catalog and fees coherent', () => {
  expect(DEFAULT_SERVICES.map(s => [s.id, s.price, s.duration])).toEqual([['natal',4900,60],['followup',8900,90],['question',2900,30]])
 })
})
describe('financial totals', () => {
 const base: Payment = {id:'one',clientId:'marina',serviceId:'natal',serviceName:'Натальная консультация',date:'2026-10-15',amount:4900,commission:196,status:'paid'}
 it('excludes pending and returned payments from income and fees', () => {
  expect(paymentTotals([base,{...base,id:'two',status:'pending'},{...base,id:'three',status:'refunded'}])).toEqual({gross:4900,fee:196,net:4704})
 })
 it('returns meaningful zeros for a new practice', () => {
  expect(paymentTotals([])).toEqual({gross:0,fee:0,net:0})
 })
})

describe('payment meeting context', () => {
 const practice = createMemberPractice()
 it('preserves the seed relationship even when payment precedes the meeting', () => {
  const payment = memberPayments.find(p => p.appointmentId === 'session-upcoming-1')!
  const meeting = paymentAppointment(payment, practice.appointments)
  expect(meeting?.id).toBe('session-upcoming-1')
  expect(meeting?.date).toBe('2026-10-19')
  expect(payment.date).toBe('2026-10-15')
 })
 it('restores a legacy relation only for an exact known payment', () => {
  const {appointmentId: _, ...saved} = memberPayments[0]
  expect(paymentAppointment(saved, practice.appointments, memberPayments)?.id).toBe(memberPayments[0].appointmentId)
  expect(paymentAppointment({...saved, amount: saved.amount + 1}, practice.appointments, memberPayments)).toBeUndefined()
  expect(paymentAppointment(saved, practice.appointments)).toBeUndefined()
 })
 it('does not open a deleted meeting or another client’s meeting', () => {
  const payment = memberPayments[0]
  expect(paymentAppointment(payment, [])).toBeUndefined()
  expect(paymentAppointment({...payment, clientId: 'different-client'}, practice.appointments)).toBeUndefined()
  expect(paymentAppointment({...payment, appointmentId: 'missing'}, practice.appointments, memberPayments)).toBeUndefined()
 })
})


describe('manual payment recording', () => {
 const pending: Payment = {id:'pending',appointmentId:'meeting',clientId:'marina',serviceId:'natal',serviceName:'Консультация',date:'2026-10-01',amount:4900,commission:0,status:'pending'}
 it('records actual receipt date without changing order data, amount or meeting relation', () => {
  const paid = markPaymentReceived(pending, '2026-10-14')
  expect(paid).toMatchObject({...pending,status:'paid',receivedDate:'2026-10-14',manualReceipt:true})
  expect(paymentDate(paid)).toBe('2026-10-14')
  expect(paymentTotals([paid])).toEqual({gross:4900,fee:0,net:4900})
  expect(pending.status).toBe('pending')
 })
 it('rejects missing, impossible and future receipt dates', () => {
  for (const date of ['', '2026-02-31', '2026-10-16', '14.10.2026']) expect(()=>markPaymentReceived(pending,date)).toThrow('Укажите корректную дату')
 })
 it('prevents repeated recording and recording of refunded payments', () => {
  for(const status of ['paid','refunded'] as const) expect(()=>markPaymentReceived({...pending,status},'2026-10-14')).toThrow('только для ожидающего заказа')
 })
 it('reverses only a manual mark, preserving the pending order and restoring totals', () => {
  const restored = undoPaymentReceipt(markPaymentReceived(pending,'2026-10-14'))
  expect(restored).toEqual(pending)
  expect(paymentDate(restored)).toBe('2026-10-01')
  expect(paymentTotals([restored])).toEqual({gross:0,fee:0,net:0})
  expect(()=>undoPaymentReceipt({...pending,status:'paid'})).toThrow('только добавленную вручную отметку')
  expect(()=>undoPaymentReceipt(pending)).toThrow('только добавленную вручную отметку')
 })
})
