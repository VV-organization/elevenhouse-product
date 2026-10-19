import {afterEach,describe,it,expect,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {CommerceFields} from './commerce-fields'
import {normalizeCommerce} from '../state/commerce-model'
import {Communication} from './Communication'
import {ServicesFinance} from './ServicesFinance'
import {createExamplePractice} from '../state/model'
import {setLocale} from '../i18n'
describe('service terms discoverability',()=>{
 it('exposes payment, delivery and required client data together before saving',()=>{
  setLocale('ru')
  const html=renderToStaticMarkup(<CommerceFields value={normalizeCommerce(undefined,5000)} onChange={()=>{}}/>)
  for(const label of ['Как оплачивается','Формат результата','Когда клиент получит результат','Методы работы','Что запросить у клиента при записи','Что открыть после покупки','Добавить дополнение','Ссылка на обложку'])expect(html).toContain(label)
  expect(html).not.toContain('aria-pressed')
 })
 it('keeps subscription and group fields accessible in English',()=>{
  setLocale('en')
  const value={...normalizeCommerce(undefined,5000),sale:'subscription' as const,audience:'group' as const,timing:'async' as const}
  const html=renderToStaticMarkup(<CommerceFields value={value} onChange={()=>{}}/>)
  for(const label of ['Billing period','Trial period, days','Preparation time, days','Maximum participants','Access after purchase'])expect(html).toContain(label)
  setLocale('ru')
 })
})

afterEach(()=>vi.unstubAllGlobals())
describe('working objects remain ahead of configuration',()=>{
 it('opens a saved conversation with history and reply before channel configuration',()=>{
  setLocale('ru')
  vi.stubGlobal('window',{location:new URL('https://example.test/product/#messages')})
  vi.stubGlobal('localStorage',{getItem:(key:string)=>key.endsWith('-messages-selected')?'"marina"':key.endsWith('-conversations')?JSON.stringify({drafts:{marina:'Сохранённый ответ'},threads:{marina:[{id:'received',from:'client',text:'Вопрос клиента',time:'15 октября · 09:30'}]}}):null})
  const html=renderToStaticMarkup(<Communication section="messages" practice={createExamplePractice()} onOpenClient={()=>{}}/>)
  expect(html).toContain('Сохранённый ответ')
  expect(html).toContain('communication-conversation-list')
  expect(html).toContain('aria-current="true"')
  expect(html).toContain('Найти разговор')
  expect(html).toContain('communication-conversation-detail')
  expect(html.indexOf('Вопрос клиента')).toBeLessThan(html.indexOf('Ваш ответ'))
  expect(html).not.toContain('Настройки этой переписки')
  expect(html).not.toContain('Ответить через')
  expect(html).toContain('aria-label="Куда отправить"')
  for(const label of ['О клиенте','Дополнить ответ','Подготовить к отправке'])expect(html).toContain(label)
 })
 it('keeps direct finance wallet entry and all operation destinations',()=>{
  setLocale('en')
  vi.stubGlobal('window',{location:new URL('https://example.test/product/?financeView=wallet#finance')})
  vi.stubGlobal('localStorage',{getItem:()=>null})
  const html=renderToStaticMarkup(<ServicesFinance section="finance" practice={createExamplePractice()} onOpenClient={()=>{}}/>)
  for(const label of ['Wallet and payouts','Prepare payout','All operations','Refunds','Client requests'])expect(html).toContain(label)
  expect(html).toContain('Available for payout')
  vi.unstubAllGlobals();setLocale('ru')
 })
})
