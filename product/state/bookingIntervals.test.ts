import {describe,it,expect} from 'vitest'
import {createEmptyPractice,type Practice} from './model'
import {availableIntervals,bookingRuleConflicts,availabilityForDate,checkBookingRules,validateBookingRules,DEFAULT_BOOKING_RULES,type BookingRules} from './bookingRules'
import {portalAvailability} from '../modules/portal-slots'
const rules=():BookingRules=>({...DEFAULT_BOOKING_RULES,enabled:true,leadHours:0,bufferAfter:0,weeklyHours:[{day:1,start:'11:00',end:'16:00'}],blockedTimes:[{id:'lunch',date:'2026-10-19',start:'12:00',end:'13:30',reason:'Lunch'}]})
const practice=():Practice=>({...createEmptyPractice('A'),bookingRules:rules()})
describe('weekly hours and personal blocked intervals',()=>{
 it('uses weekly hours while retaining common hours and date exception precedence',()=>{
  const r=rules();expect(availabilityForDate(r,'2026-10-19').start).toBe('11:00');expect(availabilityForDate(r,'2026-10-20').start).toBe('09:00');
  expect(availabilityForDate({...r,exceptions:[{date:'2026-10-19',closed:false,start:'08:00',end:'20:00'}]},'2026-10-19').start).toBe('08:00')
 })
 it('rejects appointment overlaps and buffer overlaps but permits the exact free boundary',()=>{
  const p=practice();expect(()=>checkBookingRules(p,{date:'2026-10-19',time:'11:30',duration:60})).toThrow();expect(()=>checkBookingRules(p,{date:'2026-10-19',time:'11:00',duration:60})).not.toThrow();
  p.bookingRules!.bufferAfter=15;expect(()=>checkBookingRules(p,{date:'2026-10-19',time:'11:00',duration:60})).toThrow();expect(()=>checkBookingRules(p,{date:'2026-10-19',time:'13:30',duration:60})).not.toThrow();
 })
 it('does not offer blocked times to clients, including appointments crossing a block',()=>{
  const p=practice();p.bookingRules!.slotMinutes=30;
  expect(portalAvailability(p,'2026-10-19',60,new Date('2026-10-18T00:00:00Z')).slots).toEqual(['11:00','13:30','14:00','14:30','15:00'])
 })
 it('rejects duplicate weekly days, invalid times and invalid blocked dates',()=>{
  const r=rules();expect(()=>validateBookingRules({...r,weeklyHours:[...r.weeklyHours!,...r.weeklyHours!]})).toThrow();expect(()=>validateBookingRules({...r,weeklyHours:[{day:1,start:'16:00',end:'11:00'}]})).toThrow();
  expect(()=>validateBookingRules({...r,blockedTimes:[{id:'a',date:'2026-02-30',start:'10:00',end:'11:00'}]})).toThrow();expect(()=>validateBookingRules({...r,blockedTimes:[{id:'a',date:'2026-10-19',start:'12:00',end:'12:00'}]})).toThrow();
 })
 it('keeps old saved rules compatible',()=>{expect(()=>validateBookingRules(DEFAULT_BOOKING_RULES)).not.toThrow();expect(availabilityForDate(DEFAULT_BOOKING_RULES,'2026-10-19').start).toBe('09:00')})
 it('subtracts overlapping blocks only once and clips blocks outside the working range',()=>{
  const r=rules();r.blockedTimes=[...r.blockedTimes!,{id:'overlap',date:'2026-10-19',start:'13:00',end:'14:00'},{id:'outside',date:'2026-10-19',start:'15:30',end:'18:00'}];
  expect(availableIntervals(r,'2026-10-19')).toEqual([{start:660,end:720},{start:840,end:930}])
 })
 it('reports conflicts without modifying appointments and ignores completed/cancelled history',()=>{
  const p=practice();p.appointments=[{id:'future',clientId:'x',date:'2026-10-19',time:'12:00',duration:60,title:'Consultation',status:'confirmed'},{id:'old',clientId:'x',date:'2026-10-19',time:'12:00',duration:60,title:'Old',status:'completed'}];
  const before=JSON.stringify(p);expect(bookingRuleConflicts(p,rules()).map(x=>x.appointment.id)).toEqual(['future']);expect(JSON.stringify(p)).toBe(before);
  expect(bookingRuleConflicts(p,{...rules(),enabled:false})).toEqual([])
 })

})
