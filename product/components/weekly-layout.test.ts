import {describe,expect,it} from 'vitest'
import {scheduleSegments,scheduleSlots,appointmentLanes,timeMinutes,weeklyRange,visualDuration,WEEK_MINUTE_HEIGHT} from './weekly-layout'
import type {Appointment} from '../state/model'
const meeting=(id:string,time:string,duration:number):Appointment=>({id,time,duration,date:'2026-10-19',clientId:'client',title:'Consultation',status:'confirmed'})
describe('weekly schedule positions',()=>{
 it('uses actual clock time and extends the visible range for early or late meetings',()=>{
  expect(timeMinutes('10:30')).toBe(630)
  expect(weeklyRange([meeting('early','07:30',30),meeting('late','19:15',90)])).toEqual({start:420,end:1260})
  expect(weeklyRange([])).toEqual({start:540,end:1080})
 })
 it('gives overlapping appointments separate lanes and reuses a finished lane',()=>{
  const result=appointmentLanes([meeting('third','10:30',30),meeting('long','10:00',90),meeting('short','10:00',30),meeting('next','11:30',30)])
  expect(result.map(x=>[x.appointment.id,x.lane,x.lanes])).toEqual([['long',0,2],['short',1,2],['third',1,2],['next',0,1]])
 })
 it('separates short consecutive meetings by visible height without changing their real times or durations',()=>{
  const first=meeting('first','10:00',1),second=meeting('second','10:05',5),third=meeting('third','10:30',10)
  const result=appointmentLanes([first,second,third])
  expect(result.map(x=>[x.appointment.time,x.appointment.duration,x.lane,x.lanes])).toEqual([['10:00',1,0,2],['10:05',5,1,2],['10:30',10,0,1]])
  expect(visualDuration(first.duration)*WEEK_MINUTE_HEIGHT).toBe(44)
  expect(weeklyRange([meeting('end','17:50',1)]).end).toBe(19*60)
 })
 it('keeps adjacent appointments at full width',()=>{
  expect(appointmentLanes([meeting('one','09:00',30),meeting('two','09:30',30)]).map(x=>x.lanes)).toEqual([1,1])
 })
})

import {createExamplePractice} from '../state/model'
import {DEFAULT_BOOKING_RULES} from '../state/bookingRules'
import {checkBookingRules} from '../state/bookingRules'
describe('complete calendar timeline',()=>{
 it('covers every minute and offers a fitting draft before meetings and at day end',()=>{
  const practice=createExamplePractice();practice.bookingRules=undefined
  practice.appointments=[meeting('one','11:00',60)]
  const segments=scheduleSegments(practice,'2026-10-19',{start:540,end:1080})
  expect(segments.find(s=>s.start===630)).toMatchObject({kind:'free',end:660,duration:30})
  expect(segments.find(s=>s.start===1050)).toMatchObject({kind:'free',end:1080,duration:30})
  expect(segments[0].start).toBe(540)
  expect(segments.at(-1)?.end).toBe(1080)
  segments.slice(1).forEach((s,i)=>expect(s.start).toBe(segments[i].end))
 })
 it('labels breaks, buffers and hours and keeps every offered draft bookable',()=>{
  const practice=createExamplePractice();practice.appointments=[meeting('one','11:00',60)]
  practice.bookingRules={...DEFAULT_BOOKING_RULES,enabled:true,start:'09:15',end:'15:45',bufferBefore:5,bufferAfter:10,blockedTimes:[{id:'lunch',date:'2026-10-19',start:'13:00',end:'14:00',reason:'Обед'}]}
  const segments=scheduleSegments(practice,'2026-10-19',{start:540,end:1080})
  expect(segments.find(s=>s.start===540)).toMatchObject({kind:'closed',end:555})
  expect(segments.find(s=>s.start===645)).toMatchObject({kind:'closed',end:660})
  expect(segments.find(s=>s.start===780)).toMatchObject({kind:'closed',end:840,label:'Обед'})
  expect(segments.find(s=>s.start===945)).toMatchObject({kind:'closed',end:1080})
  for(const s of segments.filter(s=>s.kind==='free')){
   expect(()=>checkBookingRules(practice,{date:'2026-10-19',time:`${String(Math.floor(s.start/60)).padStart(2,'0')}:${String(s.start%60).padStart(2,'0')}`,duration:s.duration!})).not.toThrow()
  }
  segments.slice(1).forEach((s,i)=>expect(s.start).toBe(segments[i].end))
 })
 it('explains a daily limit and releases cancelled time',()=>{
  const practice=createExamplePractice();practice.appointments=[meeting('one','11:00',60)]
  practice.bookingRules={...DEFAULT_BOOKING_RULES,enabled:true,maxPerDay:1}
  const full=scheduleSegments(practice,'2026-10-19',{start:540,end:1080})
  expect(full.filter(s=>s.kind==='free')).toEqual([])
  expect(full.find(s=>s.start===540)?.label).toBe('Лимит встреч на день')
  practice.appointments[0].status='cancelled'
  expect(scheduleSegments(practice,'2026-10-19',{start:660,end:720}).every(s=>s.kind==='free')).toBe(true)
 })
})
describe('calendar booking entry points',()=>{
 it('excludes occupied hours, including partial overlaps, but releases cancelled meetings',()=>{
  const practice=createExamplePractice();practice.bookingRules=undefined
  practice.appointments=[{...meeting('one','09:30',60),date:'2026-10-19'},{...meeting('cancel','11:00',60),date:'2026-10-19',status:'cancelled'}]
  expect(scheduleSlots(practice,'2026-10-19',{start:540,end:780})).toEqual([660,720])
 })
 it('offers half-hour starts only when the entire one-hour booking draft fits',()=>{
  const practice=createExamplePractice();practice.bookingRules=undefined
  practice.appointments=[{...meeting('occupied','11:00',60),date:'2026-10-19'}]
  expect(scheduleSlots(practice,'2026-10-19',{start:540,end:780},30)).toEqual([540,570,600,720])
 })
 it('respects enabled hours, breaks, buffers, capacity and closed exceptions',()=>{
  const practice=createExamplePractice();practice.appointments=[]
  practice.bookingRules={...DEFAULT_BOOKING_RULES,enabled:true,start:'10:00',end:'14:00',bufferBefore:0,bufferAfter:0,blockedTimes:[{id:'lunch',date:'2026-10-19',start:'12:00',end:'13:00'}]}
  expect(scheduleSlots(practice,'2026-10-19',{start:540,end:900})).toEqual([600,660,780])
  practice.appointments=[{...meeting('one','10:00',60),date:'2026-10-19'}];practice.bookingRules.bufferAfter=15
  expect(scheduleSlots(practice,'2026-10-19',{start:540,end:900})).toEqual([780])
  practice.bookingRules.maxPerDay=1
  expect(scheduleSlots(practice,'2026-10-19',{start:540,end:900})).toEqual([])
  practice.appointments=[];practice.bookingRules.exceptions=[{date:'2026-10-19',closed:true,start:'09:00',end:'18:00'}]
  expect(scheduleSlots(practice,'2026-10-19',{start:540,end:900})).toEqual([])
 })
})
