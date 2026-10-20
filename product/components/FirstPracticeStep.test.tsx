import {afterEach,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {FirstPracticeStep} from './FirstPracticeStep'
import {PracticeDashboard} from './PracticeDashboard'
import {createEmptyPractice} from '../state/model'
import {setLocale} from '../i18n'

afterEach(()=>{vi.unstubAllGlobals();setLocale('ru')})
const callbacks={onClient:()=>{},onMeeting:()=>{},onNavigate:()=>{},onNew:()=>{}}
describe('first useful action',()=>{
 it('keeps both tasks and client-only entry available without preview badges',()=>{
  setLocale('en')
  const html=renderToStaticMarkup(<FirstPracticeStep name="Anna" onBegin={()=>{}} onAddClient={()=>{}}/>)
  for(const text of ['Book your first client','Prepare a calculation','Add a client without an appointment'])expect(html).toContain(text)
  expect(html).not.toContain('checked="" disabled')
  expect(html).not.toContain('Example')
 })
 it('replaces a genuinely empty dashboard with a first action',()=>{
  const html=renderToStaticMarkup(<PracticeDashboard practice={createEmptyPractice('Анна')} {...callbacks}/>)
  expect(html).toContain('С чего начнём')
  expect(html).not.toContain('Доход за месяц')
 })
 it('does not hide existing financial data when there are no clients',()=>{
  vi.stubGlobal('window',{location:{href:'http://localhost/product/#dashboard'}})
  vi.stubGlobal('localStorage',{getItem:(key:string)=>key.endsWith('-payments')?JSON.stringify([{id:'payment',clientId:'',serviceId:'consultation',serviceName:'Консультация',amount:4900,commission:196,status:'paid',date:'2026-10-10'}]):null})
  const html=renderToStaticMarkup(<PracticeDashboard practice={createEmptyPractice('Анна')} {...callbacks}/>)
  expect(html).toContain('Доход за месяц')
  expect(html).not.toContain('С чего начнём')
 })
})
