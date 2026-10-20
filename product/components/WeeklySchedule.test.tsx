import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {WeeklySchedule} from './WeeklySchedule'
import {createExamplePractice} from '../state/model'
describe('weekly schedule client identity',()=>{
 it('keeps the free half hour immediately before a meeting visible',()=>{
  const practice=createExamplePractice()
  practice.bookingRules=undefined
  practice.appointments=[{...practice.appointments[0],date:'2026-10-19',time:'11:00',duration:60}]
  const markup=renderToStaticMarkup(<WeeklySchedule practice={practice} date="2026-10-19" onDate={()=>{}} onOpen={()=>{}} onDay={()=>{}} onNew={()=>{}}/>)
  const monday=markup.split('data-day="2026-10-19"')[1].split('data-day="2026-10-20"')[0]
  expect(monday).toMatch(/aria-label="Записать на встречу:[^"]*10:30/)
  expect(monday).toMatch(/aria-label="Записать на встречу:[^"]*17:30/)
 })
 it('shows both initials for a multiword name and preserves accessible appointment details',()=>{
  const practice=createExamplePractice()
  const appointment=practice.appointments[0]
  practice.clients=practice.clients.map(c=>c.id===appointment.clientId?{...c,name:'Мария Иванова'}:c)
  const markup=renderToStaticMarkup(<WeeklySchedule practice={practice} date={appointment.date} onDate={()=>{}} onOpen={()=>{}} onDay={()=>{}} onNew={()=>{}}/>)
  expect(markup).toContain('>МИ</span>')
  expect(markup).toContain('Мария Иванова')
  expect(markup).toContain(appointment.time)
  expect(markup).toContain('cv-time-axis')
  expect(markup).toContain('09:00')
 })
})
