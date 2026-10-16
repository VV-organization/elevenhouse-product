import {describe,it,expect} from 'vitest'
import {createEmptyPractice} from './model'
import {availabilityForDate,checkBookingRules,validateBookingRules,DEFAULT_BOOKING_RULES} from './bookingRules'
describe('date-specific availability',()=>{
 it('opens an otherwise closed Sunday and enforces its actual range',()=>{const rules={...DEFAULT_BOOKING_RULES,enabled:true,exceptions:[{date:'2026-10-18',closed:false,start:'10:00',end:'12:00'}]};const p={...createEmptyPractice('A'),bookingRules:rules};expect(()=>checkBookingRules(p,{date:'2026-10-18',time:'10:00',duration:60})).not.toThrow();expect(()=>checkBookingRules(p,{date:'2026-10-18',time:'12:00',duration:60})).toThrow();expect(availabilityForDate(rules,'2026-10-18').closed).toBe(false)})
 it('closes a weekday without deleting appointments',()=>{const p={...createEmptyPractice('A'),bookingRules:{...DEFAULT_BOOKING_RULES,enabled:true,exceptions:[{date:'2026-10-19',closed:true,start:'09:00',end:'18:00'}]}};expect(()=>checkBookingRules(p,{date:'2026-10-19',time:'10:00',duration:60})).toThrow()})
 it('rejects duplicated and impossible dates',()=>{const e={date:'2026-10-19',closed:true,start:'09:00',end:'18:00'};expect(()=>validateBookingRules({...DEFAULT_BOOKING_RULES,exceptions:[e,e]})).toThrow();expect(()=>validateBookingRules({...DEFAULT_BOOKING_RULES,exceptions:[{...e,date:'2026-02-30'}]})).toThrow()})
})
