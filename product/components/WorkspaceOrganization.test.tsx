import {afterEach,describe,it,expect,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {Workspace} from './Workspace'
import {TodayWorkbench} from './TodayWorkbench'
import {createExamplePractice} from '../state/model'
import {setLocale} from '../i18n'

function setup(hash='') {
 setLocale('ru')
 vi.stubGlobal('window',{location:new URL(`https://example.test/product/${hash}`)})
 vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{}})
}
afterEach(()=>vi.unstubAllGlobals())
const noop=()=>{}
describe('task-oriented workspace',()=>{
 it('opens daily work at the empty route while keeping the practice overview reachable',()=>{
  setup()
  const html=renderToStaticMarkup(<Workspace practice={createExamplePractice()} onChange={noop} onLogout={noop} initialAction="" clearInitialAction={noop} theme="dark" onThemeChange={noop} onClientPreview={noop}/>)
  expect(html).toContain('План на сегодня')
  expect(html).not.toContain('pd-dashboard')
  expect(html).toContain('href="#dashboard"')
 })
 it('makes all business destinations directly reachable from its named hub',()=>{
  setup('#business')
  const html=renderToStaticMarkup(<Workspace practice={createExamplePractice()} onChange={noop} onLogout={noop} initialAction="" clearInitialAction={noop} theme="dark" onThemeChange={noop} onClientPreview={noop}/>)
  for(const route of ['dashboard','finance','analytics','services','content','automations','reviews','public-profile']) expect(html).toContain(`href="#${route}"`)
  expect(html).not.toContain('Профиль практики')
 })
 it('opens a directly linked appointment plan with that appointment selected',()=>{
  const practice=createExamplePractice(),appointment=practice.appointments[1]
  setup(`?workday=briefs&briefAppointment=${appointment.id}#today`)
  const html=renderToStaticMarkup(<TodayWorkbench practice={practice} onClient={noop} onMeeting={noop} onNavigate={noop}><p>Agenda content</p></TodayWorkbench>)
  expect(html).toContain('План консультации')
  expect(html).toMatch(new RegExp(`<option[^>]*value="${appointment.id}"[^>]*selected=""`))
  expect(html).not.toContain('Agenda content')
 })
})

import {ClientDirectory} from './ClientDirectory'
import {SettingsCapabilities} from '../modules/SettingsCapabilities'
import {ClientPortal} from '../modules/ClientPortal'
import {AdminWorkspace} from '../modules/admin-workspace'
import {PracticeCalendar} from './PracticeCalendar'
describe('context and role organization',()=>{
 it('restores the selected client preview and keeps original detail destinations',()=>{
  setup('?clientPreview=marina#clients')
  const practice=createExamplePractice(),client=practice.clients.find(c=>c.id==='marina')!
  const html=renderToStaticMarkup(<ClientDirectory practice={practice} onChange={noop} onOpen={noop} onNew={noop}/>)
  for(const value of [client.notes,client.request,client.birthPlace,'Открыть карточку клиента','Карта и расчёты','Заметки и итоги','К списку клиентов'])expect(html).toContain(value)
  expect(html).toContain('aria-label="Изменить этап: Марина Иванова"')
 })
 it('makes account capabilities discoverable while showing only the chosen work area',()=>{
  setup()
  const html=renderToStaticMarkup(<SettingsCapabilities practice={createExamplePractice()} onOpenClient={noop} initialTab="profile" overview={<p>Profile form</p>}/>)
  for(const value of ['Profile form','Личные настройки','Практика и сервисы','Защита аккаунта','Мои данные рождения','Интеграции','Тариф и оплата','Приватность и данные'])expect(html).toContain(value)
  expect(html).not.toContain('name="birthDate"')
  expect(html).toContain('aria-current="page"')
 })
 it('keeps all client portal destinations in task groups',()=>{
  setup()
  const html=renderToStaticMarkup(<ClientPortal practice={createExamplePractice()} onReturn={noop}/>)
  for(const value of ['Мои консультации','Покупки','Мои материалы и данные','Встречи','Сообщения','Заказы','Подписки и оплаты','Лента','Материалы и дневник','Мои данные'])expect(html).toContain(value)
 })
 it('keeps moderator restrictions when grouping the administration navigation',()=>{
  setup()
  const html=renderToStaticMarkup(<AdminWorkspace onReturn={noop} data={{role:'moderator'}} legacy={[]}/>)
  expect(html).toContain('Модерация')
  expect(html).toContain('Журнал запросов')
  expect(html).not.toContain('Тарифы и выплаты')
  expect(html).not.toContain('Споры и возвраты')
 })
 it('shows appointments immediately in a compact calendar while date selection remains reachable',()=>{
  setup();Object.assign(window,{matchMedia:()=>({matches:true})})
  const html=renderToStaticMarkup(<PracticeCalendar practice={createExamplePractice()} date="2026-10-15" onDate={noop} onNew={noop} onOpenClient={noop} onOpenAppointment={noop} onReschedule={noop}/>)
  expect(html).toContain('Марина Иванова')
  expect(html).toContain('Выбрать другую дату')
  expect(html).not.toContain('Дни месяца')
 })
})

describe('review regressions',()=>{
 it('does not prompt for deferred approvals while keeping their history reachable',()=>{
  setup()
  const practice=createExamplePractice()
  const approval={id:'review-1',revision:'1',title:'Отложенная задача',description:'Проверить текст',clientId:'marina',appointmentId:'session-marina',kind:'message' as const,recipient:'Марина',content:'Текст',status:'pending' as const,createdAt:'2026-10-15T09:00:00Z'}
  vi.stubGlobal('localStorage',{getItem:(key:string)=>key.endsWith('approval-deferred')?JSON.stringify([`${approval.id}:${approval.revision}`]):null,setItem:noop})
  const html=renderToStaticMarkup(<TodayWorkbench practice={practice} data={{approvals:[approval]}} onClient={noop} onMeeting={noop} onNavigate={noop}><p>Agenda</p></TodayWorkbench>)
  expect(html).not.toContain('tw-pending-action')
  expect(html).toContain('Все согласования и история')
 })
 it('opens birth settings from their contextual deep link',()=>{
  setup('?settingsSection=birth#settings')
  const html=renderToStaticMarkup(<SettingsCapabilities practice={createExamplePractice()} onOpenClient={noop} initialTab="profile" overview={<p>Profile form</p>}/>)
  expect(html).toContain('Сохранить данные рождения')
  expect(html).not.toContain('Profile form')
 })
})


describe('calendar contextual routes',()=>{
 for(const [route,expected] of [['#astro-calendar','Астрокалендарь'],['?reminders=active#astro-calendar','Активных напоминаний ·']] as const){
  it(`preserves the intended calendar destination for ${route}`,()=>{
   setup(route)
   const html=renderToStaticMarkup(<Workspace practice={createExamplePractice()} onChange={noop} onLogout={noop} initialAction="" clearInitialAction={noop} theme="dark" onThemeChange={noop} onClientPreview={noop}/>)
   expect(html).toContain(expected)
   if(route.includes('reminders='))expect(html).not.toContain('class="ec-astro-calendar"')
   else expect(html).not.toContain('Активных напоминаний ·')
  })
 }
})
