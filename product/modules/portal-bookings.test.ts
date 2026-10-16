import {DEFAULT_BOOKING_RULES,validateBookingRules} from '../state/bookingRules'
import {describe,it,expect} from 'vitest'
import {reconcilePortalBookings,portalCancellation,bookingSchedule,updatePortalProfile,type Booking} from './portal-bookings'
import type {Practice} from '../state/model'
import type {PortalOrder} from './portal-order-model'
const a={id:'a1',clientId:'marina',title:'New title',serviceId:'s',price:2000,duration:90,date:'2026-10-20',time:'12:00',status:'confirmed' as const}
const b:Booking={id:'old',appointmentId:'a1',serviceId:'s',title:'Old title',price:1000,duration:60,date:'2026-10-19',time:'11:00',status:'confirmed'}
const order={id:'o1',clientId:'marina',serviceId:'s',title:'Order',total:2000,status:'accepted',appointment:{id:'a1',date:a.date,time:a.time,duration:90}} as PortalOrder

describe('portal calendar reconciliation',()=>{
 it('adds specialist-created appointments and applies moves and current terms',()=>{
  expect(reconcilePortalBookings([], [a], 'marina',[])[0]).toMatchObject({appointmentId:'a1',time:'12:00',duration:90})
  expect(reconcilePortalBookings([b],[a],'marina',[])[0]).toMatchObject({id:'old',date:a.date,time:a.time,title:a.title,price:2000,duration:90})
  expect(b.time).toBe('11:00')
 })
 it.each(['completed','cancelled'] as const)('preserves authoritative %s even for accepted orders',status=>{
  expect(reconcilePortalBookings([{...b,orderId:'o1'}],[{...a,status}],'marina',[order])[0].status).toBe(status)
 })
 it('deduplicates exact appointment IDs while retaining the order connection',()=>{
  const rows=reconcilePortalBookings([b,{...b,id:'request',orderId:'o1'}],[a],'marina',[order])
  expect(rows).toHaveLength(1);expect(rows[0].orderId).toBe('o1')
 })
 it('retains pending requests, legacy and removed calendar records without fuzzy matching',()=>{
  const pending={...b,id:'pending',appointmentId:undefined,status:'pending' as const}
  const legacy={...pending,id:'legacy',status:'confirmed' as const}
  const rows=reconcilePortalBookings([b,pending,legacy],[],'marina',[])
  expect(rows.map(r=>r.id)).toEqual(['old','pending','legacy'])
 })
 it('recovers an appointment request from its order and excludes another client',()=>{
  expect(reconcilePortalBookings([],[],'marina',[{...order,status:'requested'}])[0]).toMatchObject({orderId:'o1',status:'pending'})
  expect(reconcilePortalBookings([b],[{...a,clientId:'olga'}],'marina',[])).toEqual([])
  expect(reconcilePortalBookings([{...b,orderId:'o1'}],[],'olga',[order])).toEqual([])
  expect(reconcilePortalBookings([b],[a],undefined,[order])).toEqual([])
 })
 it('does not let stale or cancelled caches override actual occupied time',()=>{
  const schedule=bookingSchedule([a],[{...b,status:'cancelled'}])
  expect(schedule).toEqual([a])
 })
 it('maps the exact legacy original record only for Marina',()=>{
  const legacy={...b,id:'original',appointmentId:undefined}
  const rows=reconcilePortalBookings([legacy],[{...a,id:'session-marina'}],'marina',[])
  expect(rows).toHaveLength(1);expect(rows[0].appointmentId).toBe('session-marina')
 })
})
describe('portal profile propagation',()=>{
 it('updates only the selected client birth/name fields without losing CRM or private data',()=>{
  const client={id:'marina',name:'Марина',birthDate:'1990-01-01',birthTime:'12:00',birthPlace:'Москва',unknownTime:false,request:'request',notes:'private',updatedAt:'old',email:'m@example.com',tags:['VIP']}
  const practice={version:1,profile:{name:'Anna',timeZone:'Europe/Moscow'},clients:[client,{...client,id:'olga'}],appointments:[a],isExample:true,onboarded:true} as Practice
  const next=updatePortalProfile(practice,'marina',{name:' Марина Иванова ',birthDate:'1991-02-03',birthTime:'12:00',birthPlace:' Казань ',unknownTime:true},'now')
  expect(next.clients[0]).toMatchObject({name:'Марина Иванова',birthDate:'1991-02-03',birthTime:'',birthPlace:'Казань',unknownTime:true,updatedAt:'now',notes:'private',email:'m@example.com',tags:['VIP']})
  expect(next.clients[1]).toBe(practice.clients[1]);expect(next.appointments).toBe(practice.appointments);expect(client.birthTime).toBe('12:00')
 })
})

describe('self-cancellation policy',()=>{
 const practice={version:1,profile:{name:'Anna',timeZone:'Europe/Moscow'},clients:[],appointments:[a],isExample:true,onboarded:true,bookingRules:{...DEFAULT_BOOKING_RULES,cancellationHours:24}} as Practice
 it('uses the astrologer time zone and enforces the exact deadline',()=>{
  expect(portalCancellation(practice,b,'marina',new Date('2026-10-19T09:00:00Z')).allowed).toBe(true)
  expect(portalCancellation(practice,b,'marina',new Date('2026-10-19T09:00:01Z')).reason).toBe('notice')
  expect(portalCancellation(practice,b,'marina',new Date('2026-10-20T09:00:00Z')).reason).toBe('past')
 })
 it('defaults to cancellation before start and does not reuse free-rescheduling policy',()=>{
  const rules={...DEFAULT_BOOKING_RULES,rescheduleHours:168,cancellationHours:undefined}
  expect(portalCancellation({...practice,bookingRules:rules},b,'marina',new Date('2026-10-20T08:59:59Z')).allowed).toBe(true)
 })
 it.each(['completed','cancelled'] as const)('blocks the latest %s source even if the open card is stale',status=>{
  expect(portalCancellation({...practice,appointments:[{...a,status}]},b,'marina',new Date('2026-10-18T00:00:00Z')).reason).toBe('finished')
 })
 it('does not restrict withdrawal of an unconfirmed future request by accepted-meeting notice',()=>{
  expect(portalCancellation(practice,{...b,appointmentId:undefined,status:'pending',date:a.date,time:a.time},'marina',new Date('2026-10-20T08:00:00Z')).allowed).toBe(true)
 })
 it('validates cancellation settings without changing old profiles',()=>{
  expect(()=>validateBookingRules({...DEFAULT_BOOKING_RULES,cancellationHours:-1})).toThrow()
  expect(()=>validateBookingRules({...DEFAULT_BOOKING_RULES,cancellationHours:NaN})).toThrow()
  expect(()=>validateBookingRules({...DEFAULT_BOOKING_RULES,cancellationHours:undefined})).not.toThrow()
 })
})
