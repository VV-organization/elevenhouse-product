import {describe,it,expect} from 'vitest'
import {commerceDefaults} from '../state/commerce-model'
import type {Service,Payment} from './ServicesFinance'
import {isAppointmentService,orderTotal,createPortalOrder,portalPayment} from './portal-order-model'
import {portalAvailability,zonedTimestamp} from './portal-slots'
import {createEmptyPractice} from '../state/model'
import {DEFAULT_BOOKING_RULES} from '../state/bookingRules'
const service:Service={id:'pack',name:'Сопровождение',description:'Пакет консультаций',duration:60,price:12000,includes:['Три встречи'],status:'available',commerce:{...commerceDefaults(4000),sale:'pack',extras:[{id:'record',name:'Запись',kind:'percent',price:10}]}}
describe('client order semantics',()=>{
 it('offers a first time slot for individual live packages while keeping other products as orders',()=>{
  expect(isAppointmentService(service)).toBe(true)
  for(const patch of [{sale:'subscription' as const},{sale:'free' as const},{sale:'once' as const,timing:'async' as const},{sale:'once' as const,audience:'group' as const}])expect(isAppointmentService({...service,commerce:{...service.commerce!,...patch}})).toBe(false)
  expect(isAppointmentService({...service,commerce:commerceDefaults()})).toBe(true)
 })
 it('charges additions once on package total and free stays free',()=>{
  expect(orderTotal(service,['record','record','unknown'])).toBe(13200)
  expect(orderTotal({...service,commerce:{...service.commerce!,sale:'free'}},['record'])).toBe(0)
 })
 it('keeps purchased terms as immutable request snapshot without payment or access claims',()=>{
  const draft=structuredClone(service),answers={question:'Career'}
  const order=createPortalOrder(draft,['record'],answers,'marina')
  draft.commerce!.extras[0].price=90;draft.includes.push('New');answers.question='Other'
  expect(order.total).toBe(13200);expect(order.commerce.extras[0].price).toBe(10);expect(order.includes).toEqual(['Три встречи']);expect(order.answers.question).toBe('Career');expect(order.status).toBe('requested');expect(order).not.toHaveProperty('paid');expect(order).not.toHaveProperty('accessUntil');expect(order).not.toHaveProperty('appointment')
 })
 it('shows a payment only for exact appointment and client linkage',()=>{
  const payment:Payment={id:'p',appointmentId:'a',clientId:'marina',serviceId:'s',serviceName:'Service',date:'2026-10-16',amount:100,commission:0,status:'paid'}
  expect(portalPayment('a','marina',[payment])).toBe(payment)
  expect(portalPayment('a','dmitry',[payment])).toBeUndefined();expect(portalPayment(undefined,'marina',[payment])).toBeUndefined()
 })
})
describe('client self-booking availability',()=>{
 const practice={...createEmptyPractice('Анна'),profile:{name:'Анна',timeZone:'Europe/Moscow'},bookingRules:{...DEFAULT_BOOKING_RULES,enabled:true,days:[1,2,3,4,5],start:'09:00',end:'18:00',leadHours:1,bufferAfter:15,slotMinutes:30}}
 const now=new Date('2026-10-16T05:00:00Z') // 08:00 in Moscow
 it('generates slots in the astrologer timezone using duration, buffers and busy periods',()=>{
  const result=portalAvailability({...practice,appointments:[{id:'a',clientId:'c',date:'2026-10-16',time:'10:00',duration:60,status:'confirmed',title:'Work'}]},'2026-10-16',60,now)
  expect(result.slots).not.toContain('09:00');expect(result.slots).not.toContain('09:30');expect(result.slots).not.toContain('11:00');expect(result.slots).toContain('11:30');expect(result.slots.at(-1)).toBe('17:00')
 })
 it('uses date-specific extended hours and closures instead of only recurring hours',()=>{
  const rules={...practice.bookingRules,exceptions:[{date:'2026-10-17',closed:false,start:'19:00',end:'21:00'},{date:'2026-10-19',closed:true,start:'09:00',end:'18:00'}]}
  const adjusted={...practice,bookingRules:rules}
  expect(portalAvailability(adjusted,'2026-10-17',60,now).slots).toEqual(['19:00','19:30','20:00'])
  expect(portalAvailability(adjusted,'2026-10-19',60,now).slots).toEqual([])
 })
 it('does not invent availability when it is closed or on an off day',()=>{
  expect(portalAvailability({...practice,bookingRules:undefined},'2026-10-16',60,now).slots).toEqual([])
  expect(portalAvailability(practice,'2026-10-17',60,now).slots).toEqual([])
 })
 it('respects minimum notice, booking horizon and daily capacity',()=>{
  expect(portalAvailability(practice,'2026-10-16',60,new Date('2026-10-16T06:15:00Z')).slots[0]).toBe('10:30')
  expect(portalAvailability(practice,'2027-02-01',60,now).slots).toEqual([])
  const full={...practice,bookingRules:{...practice.bookingRules,maxPerDay:1},appointments:[{id:'a',clientId:'c',date:'2026-10-16',time:'10:00',duration:60,status:'confirmed' as const,title:'Work'}]}
  expect(portalAvailability(full,'2026-10-16',60,now).slots).toEqual([])
 })
 it('rejects nonexistent spring DST times and converts normal wall times',()=>{
  expect(zonedTimestamp('2026-10-16','11:00','Europe/Moscow')).toBe(Date.parse('2026-10-16T08:00:00Z'))
  expect(Number.isNaN(zonedTimestamp('2026-03-29','02:30','Europe/Berlin'))).toBe(true)
 })
})
