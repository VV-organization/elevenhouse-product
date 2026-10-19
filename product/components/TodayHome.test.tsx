import {describe,it,expect,beforeEach} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {TodayAgenda} from './TodayAgenda'
import {TodayHome} from './TodayHome'
import {TodayWorkbench} from './TodayWorkbench'
import {createExamplePractice,type Appointment} from '../state/model'
import {setLocale} from '../i18n'

const noop=()=>{}
beforeEach(()=>setLocale('ru'))
describe('reference-based working day preserves actionable information',()=>{
 it('focuses the earliest confirmed appointment and keeps cancelled and completed records in the schedule',()=>{
  const practice=createExamplePractice(),seed=practice.appointments[0]
  const items:Appointment[]=[{...seed,id:'late',time:'16:00',title:'Поздняя встреча'},{...seed,id:'finished',time:'09:00',status:'completed',title:'Завершённая встреча'},{...seed,id:'cancelled',time:'10:00',status:'cancelled',title:'Отменённая встреча'},{...seed,id:'first',time:'11:00',title:'Первая доступная'}]
  const html=renderToStaticMarkup(<TodayAgenda practice={practice} items={items} onMeeting={noop} onClient={noop} onNew={noop}/>)
  const focus=html.slice(0,html.indexOf('class="td-schedule"'))
  expect(focus).toContain('Первая доступная')
  expect(focus).not.toContain('Поздняя встреча')
  expect((html.match(/class="td-meeting-row"/g)||[])).toHaveLength(4)
  expect(html).toContain('Завершённая встреча')
  expect(html).toContain('Отменённая встреча')
  expect(html).toContain(practice.clients[0].request)
 })
 it('does not present a cancelled or completed meeting as needing preparation',()=>{
  const practice=createExamplePractice()
  const html=renderToStaticMarkup(<TodayAgenda practice={practice} items={practice.appointments.map(a=>({...a,status:'completed'}))} onMeeting={noop} onClient={noop} onNew={noop}/>)
  expect(html).not.toContain('Подготовиться')
  expect(html).toContain('Расписание на сегодня')
  expect((html.match(/class="td-meeting-row"/g)||[])).toHaveLength(practice.appointments.length)
 })
 it('keeps the booking action available on an empty day',()=>{
  const practice=createExamplePractice()
  const html=renderToStaticMarkup(<TodayAgenda practice={practice} items={[]} onMeeting={noop} onClient={noop} onNew={noop}/>)
  expect(html).toContain('Сегодня нет встреч')
  expect(html).toContain('Запланировать встречу')
  expect(html).not.toContain('today-focus-title')
 })
 it('counts planned duration without adding cancelled or completed meetings',()=>{
  const practice=createExamplePractice(),seed=practice.appointments[0]
  const items:Appointment[]=[{...seed,id:'a',duration:45},{...seed,id:'b',duration:60,status:'cancelled'},{...seed,id:'c',duration:90,status:'completed'}]
  const html=renderToStaticMarkup(<TodayHome practice={practice} items={items} recentClients={practice.clients} incompleteClients={[]} search="Нет такого имени" onSearch={noop} tools={null} pending={null} onMeeting={noop} onClient={noop} onMissing={noop} onPrepare={noop} onNew={noop} onNewClient={noop} onCalculations={noop} onMessages={noop} onReminders={noop}/>)
  expect(html).toContain('<dd>45 мин</dd>')
  expect(html).toContain('Клиент не найден.')
  expect(html).toContain('Добавить клиента')
 })
 it('retains sky, briefs, approvals and pending review when using the new day layout',()=>{
  const practice=createExamplePractice()
  const approval={id:'review',revision:'1',title:'Проверить текст',description:'',kind:'message' as const,recipient:'Клиент',content:'Текст',status:'pending' as const,createdAt:'2026-10-15'}
  const html=renderToStaticMarkup(<TodayWorkbench practice={practice} data={{approvals:[approval]}} onClient={noop} onMeeting={noop} onNavigate={noop} renderDay={(tools,pending)=><aside>{pending}{tools}</aside>}/>)
  expect(html).toContain('Проверить перед отправкой')
  expect(html).toContain('Проверить текст')
  expect(html).toContain('События и транзиты')
  expect(html).toContain('Планы консультаций и AI-брифы')
  expect(html).toContain('Все согласования и история')
 })
})
