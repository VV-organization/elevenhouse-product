import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {WeeklySchedule} from './WeeklySchedule'
import {createExamplePractice} from '../state/model'
describe('weekly schedule client identity',()=>{
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
