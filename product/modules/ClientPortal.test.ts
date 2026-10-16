import { describe, expect, it } from 'vitest'
import { bookingSchedule, bookingValidation, profileValidation, validCalendarDate, type Booking } from './ClientPortal'

describe('booking checks at confirmation', () => {
 it('rejects invalid and past dates even without native form validation', () => {
  expect(bookingValidation('2026-10-14','09:00',60)).toContain('дату')
  expect(bookingValidation('2026-02-30','09:00',60)).toContain('дату')
  expect(bookingValidation('','09:00',60)).toContain('дату')
  expect(validCalendarDate('2028-02-29')).toBe(true)
  expect(validCalendarDate('2027-02-29')).toBe(false)
 })
 it('rejects duration extending beyond midnight', () => {
  expect(bookingValidation('2026-10-16','17:00',480)).toContain('не помещается')
  expect(bookingValidation('2026-10-16','16:00',480)).toBe('')
 })
 it('blocks overlap, but allows adjacent and cancelled slots', () => {
  const occupied = [{date:'2026-10-16',time:'11:00',duration:60,status:'confirmed'}]
  expect(bookingValidation('2026-10-16','10:30',60,occupied)).toContain('занято')
  expect(bookingValidation('2026-10-16','12:00',60,occupied)).toBe('')
  expect(bookingValidation('2026-10-16','11:00',60,[{...occupied[0],status:'cancelled'}])).toBe('')
 })
})
describe('client profile before commit', () => {
 const profile={name:'Марина',birthDate:'1990-03-14',birthTime:'08:25',birthPlace:'Москва',unknownTime:false}
 it('rejects blank names and future birthdays', () => {
  expect(profileValidation({...profile,name:'   '})).toContain('обращаться')
  expect(profileValidation({...profile,birthDate:'2027-01-01'})).toContain('будущем')
 })
 it('allows optional birth details and explicitly unknown time', () => {
  expect(profileValidation({...profile,birthDate:'',birthTime:'',birthPlace:''})).toBe('')
  expect(profileValidation({...profile,birthTime:'',unknownTime:true})).toBe('')
 })
})

describe('linked booking cancellation', () => {
 const original:Booking={id:'original',serviceId:'natal',title:'Консультация',price:4900,duration:60,date:'2026-10-15',time:'11:00',status:'cancelled'}
 const appointment={id:'session-marina',clientId:'marina',title:'Консультация',duration:60,date:'2026-10-15',time:'11:00',status:'confirmed' as const}
 it('keeps calendar occupied until the actual appointment is cancelled',()=>{
  const occupied=bookingSchedule([appointment],[original])
  expect(bookingValidation('2026-10-15','11:00',60,occupied)).toContain('занято')
 })
 it('does not free a different overlapping appointment',()=>{
  const occupied=bookingSchedule([appointment,{...appointment,id:'another',clientId:'olga'}],[original])
  expect(bookingValidation('2026-10-15','11:00',60,occupied)).toContain('занято')
 })
 it('keeps a linked pending request occupied and does not mutate source data',()=>{
  const pending={...original,status:'pending' as const,appointmentId:'session-marina'}
  const occupied=bookingSchedule([appointment],[pending])
  expect(occupied).toHaveLength(1)
  expect(bookingValidation('2026-10-15','11:00',60,occupied)).toContain('занято')
  expect(appointment.status).toBe('confirmed')
 })
})
