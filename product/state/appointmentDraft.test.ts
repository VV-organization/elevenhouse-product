import {describe,expect,it} from 'vitest'
import {initialAppointmentDraft,readAppointmentDraft,type AppointmentDraft} from './appointmentDraft'
import {createExamplePractice,TODAY} from './model'
const draft:AppointmentDraft={clientId:'marina',serviceId:'followup',title:'Мой запрос',date:'2026-11-08',time:'17:15',duration:'75',price:'4250.50'}
describe('appointment draft during client creation',()=>{
 it('requires an explicit time and keeps an intentionally unselected follow-up date',()=>{
  expect(initialAppointmentDraft({clientId:'marina',date:TODAY}).time).toBe('')
  expect(initialAppointmentDraft({clientId:'marina',date:''}).date).toBe('')
 })
 it('retains every entered field while moving to another form',()=>{
  const data=new FormData()
  for(const [key,value] of Object.entries(draft))data.set(key,value)
  expect(readAppointmentDraft(data)).toEqual(draft)
 })
 it('uses the newly created client and retains service, date and custom values',()=>{
  const initial=initialAppointmentDraft({initialDraft:draft,clientId:'new-client',date:TODAY})
  expect(initial).toEqual({...draft,clientId:'new-client'})
  expect(draft.clientId).toBe('marina')
 })
 it('returns to the previous client when creation is cancelled, including deliberately empty inputs',()=>{
  const unfinished={...draft,title:'',price:'',duration:'',date:''}
  expect(initialAppointmentDraft({initialDraft:unfinished,date:TODAY})).toEqual(unfinished)
 })
 it('keeps existing appointment data authoritative during rescheduling',()=>{
  const appointment={...createExamplePractice().appointments[0],serviceId:'natal',price:0,duration:75}
  expect(initialAppointmentDraft({appointment,initialDraft:draft,clientId:'other',date:TODAY})).toEqual({clientId:appointment.clientId,serviceId:'natal',price:'0',duration:'75',title:appointment.title,date:appointment.date,time:appointment.time})
 })
})
