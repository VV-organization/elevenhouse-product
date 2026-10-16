import {describe,expect,it} from 'vitest'
import {addAppointment,completeAppointment,createExamplePractice,parsePractice,rescheduleAppointment,restoreAppointmentAt,setAppointmentStatus,type Appointment} from './model'

describe('consultation details and outcome',()=>{
 it('restores a cancelled meeting at a new time with the same identity and conditions',()=>{
  const original=createExamplePractice()
  const priced={...original,appointments:original.appointments.map((a,i)=>i===0?{...a,serviceId:'natal',price:4200,outcome:'Сохранённая история'}:a)}
  const cancelled=setAppointmentStatus(priced,'session-marina','cancelled')
  const before=JSON.stringify(cancelled)
  const old=cancelled.appointments[0]
  const restored=restoreAppointmentAt(cancelled,old.id,{date:'2026-10-20',time:'10:00',duration:old.duration,title:old.title})
  expect(restored.appointments[0]).toMatchObject({...old,status:'confirmed',date:'2026-10-20',time:'10:00'})
  expect(restored.appointments).toHaveLength(cancelled.appointments.length)
  expect(JSON.stringify(cancelled)).toBe(before)
 })
 it('rejects restoration to an occupied time without changing the cancellation',()=>{
  const cancelled=setAppointmentStatus(createExamplePractice(),'session-marina','cancelled')
  const old=cancelled.appointments[0],occupied=cancelled.appointments[1]
  expect(()=>restoreAppointmentAt(cancelled,old.id,{...old,date:occupied.date,time:occupied.time})).toThrow(/занято/i)
  expect(cancelled.appointments[0].status).toBe('cancelled')
  expect(()=>restoreAppointmentAt(createExamplePractice(),old.id,{...old})).toThrow(/отменённую/)
 })

 it('restores older appointments without inventing services, prices or outcomes',()=>{
  const original=createExamplePractice()
  expect(parsePractice(JSON.stringify(original))).toEqual(original)
  expect(original.appointments[0].serviceId).toBeUndefined()
  expect(original.appointments[0].price).toBeUndefined()
  expect(original.appointments[0].outcome).toBeUndefined()
 })
 it('retains chosen service, custom price and nonstandard duration through saving and moving',()=>{
  const original=createExamplePractice()
  const input={clientId:'marina',date:'2026-10-20',time:'10:00',duration:75,title:'Личная консультация',serviceId:'natal',price:4200}
  const created=addAppointment(original,input)
  const meeting=created.appointments.at(-1)!
  const moved=rescheduleAppointment(created,meeting.id,{date:'2026-10-21',time:'09:00',duration:75,title:meeting.title})
  expect(moved.appointments.at(-1)).toMatchObject({...input,id:meeting.id,date:'2026-10-21',time:'09:00'})
  expect(parsePractice(JSON.stringify(moved))).toEqual(moved)
  expect(original.appointments).toHaveLength(3)
 })
 it('can change service metadata or explicitly detach a service without altering another meeting',()=>{
  const original=createExamplePractice()
  const meeting=original.appointments[0]
  const updated=rescheduleAppointment(original,meeting.id,{...meeting,serviceId:'followup',price:0})
  expect(updated.appointments[0]).toMatchObject({serviceId:'followup',price:0})
  const detached=rescheduleAppointment(updated,meeting.id,{...meeting,serviceId:undefined,price:undefined})
  expect(detached.appointments[0].serviceId).toBeUndefined()
  expect(detached.appointments[0].price).toBeUndefined()
  expect(detached.appointments[1]).toBe(original.appointments[1])
 })
 it('links outcome to a specific meeting and keeps personal notes and other history intact',()=>{
  const original=createExamplePractice()
  const before=JSON.stringify(original)
  const updated=completeAppointment(original,'session-marina','  Обсудили переход в новую роль.\nСледующий шаг — разговор с командой.  ')
  expect(updated.appointments[0]).toMatchObject({id:'session-marina',clientId:'marina',status:'completed',outcome:'Обсудили переход в новую роль.\nСледующий шаг — разговор с командой.'})
  expect(updated.clients).toBe(original.clients)
  expect(updated.appointments[1]).toBe(original.appointments[1])
  expect(parsePractice(JSON.stringify(updated))).toEqual(updated)
  expect(JSON.stringify(original)).toBe(before)
  const restored=setAppointmentStatus(updated,'session-marina','confirmed')
  const moved=rescheduleAppointment(restored,'session-marina',{...restored.appointments[0],date:'2026-10-20',outcome:'do not overwrite through reschedule'})
  expect(moved.appointments[0].outcome).toBe(updated.appointments[0].outcome)
 })
 it('allows explicit completion without a note and adding an outcome later',()=>{
  const original=createExamplePractice()
  const completed=completeAppointment(original,'session-marina','')
  expect(completed.appointments[0]).toMatchObject({status:'completed',outcome:''})
  expect(completeAppointment(completed,'session-marina','Итог').appointments[0].outcome).toBe('Итог')
 })
 it('rejects wrong associations and invalid outcome data',()=>{
  const original=createExamplePractice()
  expect(()=>completeAppointment(original,'missing','Итог')).toThrow(/найдена/)
  expect(()=>completeAppointment(setAppointmentStatus(original,'session-marina','cancelled'),'session-marina','Итог')).toThrow(/отменённую/)
  expect(()=>completeAppointment(original,'session-marina',null as unknown as string)).toThrow(/текст/)
 })
 it('validates optional persisted consultation fields while accepting a free consultation',()=>{
  const original=createExamplePractice()
  for(const patch of [{price:-1},{price:'4900'},{serviceId:''},{serviceId:123},{outcome:[]}] as unknown as Partial<Appointment>[]){
   const corrupted={...original,appointments:[{...original.appointments[0],...patch},...original.appointments.slice(1)]}
   expect(parsePractice(JSON.stringify(corrupted))).toBeNull()
  }
  const free={...original,appointments:[{...original.appointments[0],price:0},...original.appointments.slice(1)]}
  expect(parsePractice(JSON.stringify(free))).toEqual(free)
 })
})
