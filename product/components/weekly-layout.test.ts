import {describe,expect,it} from 'vitest'
import {appointmentLanes,timeMinutes,weeklyRange,visualDuration,WEEK_MINUTE_HEIGHT} from './weekly-layout'
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
