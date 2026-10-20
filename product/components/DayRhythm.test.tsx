import {afterEach,describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {DayRhythm,dayRhythm} from './DayRhythm'
import {createExamplePractice,type Appointment} from '../state/model'
import {setLocale} from '../i18n'

const date='2026-10-15'
const meeting=(id:string,time:string,duration:number):Appointment=>({id,time,duration,date,clientId:'marina',title:'Consultation',status:'confirmed'})
afterEach(()=>setLocale('ru'))

describe('day rhythm',()=>{
 it('uses only the selected day and excludes cancelled appointments from hours and total duration',()=>{
  const result=dayRhythm([meeting('later','14:00',90),meeting('first','11:00',60),{...meeting('cancel','06:00',120),status:'cancelled'},{...meeting('tomorrow','23:00',60),date:'2026-10-16'}],date)
  expect(result.items.map(a=>a.id)).toEqual(['first','later'])
  expect(result.minutes).toBe(150)
  expect([result.start,result.end]).toEqual([540,1080])
 })
 it('extends the timeline to contain early and late meetings',()=>{
  const result=dayRhythm([meeting('early','07:30',30),meeting('late','19:15',90)],date)
  expect([result.start,result.end]).toEqual([420,1260])
 })
 it('keeps simultaneous meetings separately reachable',()=>{
  const result=dayRhythm([meeting('long','11:00',90),meeting('short','11:15',30)],date)
  expect(result.lanes.map(l=>[l.lane,l.lanes])).toEqual([[0,2],[1,2]])
 })
 it('shows an empty calendar action without fake intervals',()=>{
  setLocale('en')
  const practice=createExamplePractice();practice.appointments=[]
  const html=renderToStaticMarkup(<DayRhythm practice={practice} date={date} onOpen={()=>{}}/>)
  expect(html).toContain('No appointments')
  expect(html).toContain('href="#calendar"')
  expect(html).not.toContain('<button')
  expect(html).not.toMatch(/NaN|Infinity/)
 })
 it('names every interactive interval with its exact time, client, service and status',()=>{
  setLocale('en')
  const practice=createExamplePractice()
  practice.clients[0].id='marina';practice.clients[0].name='Marina'
  practice.appointments=[meeting('first','11:00',60),{...meeting('done','09:00',45),status:'completed'}]
  const html=renderToStaticMarkup(<DayRhythm practice={practice} date={date} onOpen={()=>{}}/>)
  expect(html).toContain('11:00–12:00 · Marina · Consultation')
  expect(html).toContain('09:00–09:45 · Marina · Consultation')
  expect(html).toContain('1 h 45 min')
  expect(html.match(/<button/g)).toHaveLength(2)
 })
})
