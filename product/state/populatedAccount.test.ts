import {describe,it,expect} from 'vitest'
import {createExamplePractice,createEmptyPractice,parsePractice} from './model'
import {createMemberPractice} from './memberCore'
import {populateSavedAccount,populateShowcaseAccount,populatedPractice} from './populatedAccount'
import {populatedModules} from './populatedModules'
import {validateFlow,type Flow} from './communication-workflows'
import {commerceError,normalizeCommerce,type MoneyDraft} from './commerce-model'
import type {Payment,Service} from '../modules/ServicesFinance'
import type {PortalOrder} from '../modules/portal-order-model'
import type {ClientCase} from '../modules/portal-case-model'
import {initialPayments} from '../modules/ServicesFinance'
function store(){const values=new Map<string,string>();return {values,getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)}}}
const moduleKey=(name:string)=>`eh-product-v2-example-${name}`
describe('populated presentation account',()=>{
 it('has valid non-overlapping meetings, priced service links and all lifecycle states',()=>{
  const p=createMemberPractice(),services=populatedModules.services as Service[]
  expect(p.clients).toHaveLength(24);expect(p.appointments).toHaveLength(96)
  expect(parsePractice(JSON.stringify(p))).toEqual(p)
  for(const a of p.appointments){expect(services.some(s=>s.id===a.serviceId&&s.price===a.price)).toBe(true);if(a.status==='completed')expect(a.outcome).toBeTruthy()}
  for(const s of services)expect(commerceError(normalizeCommerce(s.commerce,s.price))).toBeUndefined()
 })
 it('links financial records, requests and cases to matching owners',()=>{
  const p=createMemberPractice(),payments=populatedModules.payments as Payment[],orders=populatedModules['client-orders'] as PortalOrder[]
  for(const receipt of payments){expect(p.clients.some(c=>c.id===receipt.clientId)).toBe(true);if(receipt.appointmentId)expect(p.appointments.some(a=>a.id===receipt.appointmentId&&a.clientId===receipt.clientId)).toBe(true);if(receipt.orderId)expect(orders.some(o=>o.id===receipt.orderId&&o.clientId===receipt.clientId&&o.total===receipt.amount)).toBe(true)}
  for(const c of populatedModules['client-cases'] as ClientCase[]){if(c.orderId)expect(orders.some(o=>o.id===c.orderId&&o.clientId===c.clientId)).toBe(true);if(c.paymentId)expect(payments.some(p=>p.id===c.paymentId&&p.clientId===c.clientId)).toBe(true)}
  for(const d of populatedModules['money-requests'] as MoneyDraft[])if(d.kind==='refund')expect(payments.some(p=>p.id===d.paymentId&&p.status==='paid'&&p.amount>=d.amount)).toBe(true)
  for(const flow of populatedModules.automations as Flow[])expect(validateFlow(flow),flow.name).toBeFalsy()
 })
 it('upgrades the old three-client example once, with backup and no duplicate appointment payments',()=>{
  const s=store(),before=createExamplePractice();before.clients[0].notes='Моя заметка';s.setItem('eh-product-v1-example',JSON.stringify(before));s.setItem(moduleKey('payments'),JSON.stringify(initialPayments()))
  s.setItem(moduleKey('conversations'),JSON.stringify({threads:{marina:[{id:'mine',text:'Мой ответ'}]},drafts:{marina:'Мой черновик'}}))
  const after=populateSavedAccount(s,'example',before)
  expect(after.clients).toHaveLength(24);expect(after.clients[0].notes).toBe('Моя заметка');expect(after.appointments[0].duration).toBe(60)
  const payments=JSON.parse(s.getItem(moduleKey('payments'))!) as Payment[]
  expect(payments.filter(p=>p.appointmentId==='session-marina')).toHaveLength(1)
  expect(payments.find(p=>p.id==='EH-1045')?.amount).toBe(4900)
  expect(JSON.parse(s.getItem(moduleKey('conversations'))!).drafts.marina).toBe('Мой черновик')
  const backupKey=[...s.values.keys()].find(k=>k.endsWith('-backup'))!
  expect(JSON.parse(s.getItem(backupKey)!)['eh-product-v1-example']).toBe(JSON.stringify(before))
  const snapshot=JSON.stringify([...s.values]);expect(populateSavedAccount(s,'example',after)).toEqual(after);expect(JSON.stringify([...s.values])).toBe(snapshot)
  after.clients=after.clients.filter(c=>c.id!=='sofia');expect(populateSavedAccount(s,'example',after).clients.some(c=>c.id==='sofia')).toBe(false)
 })
 it('keeps custom bookings and omits colliding fixture meetings with dependent payments',()=>{
  const before=createExamplePractice();before.appointments.push({id:'custom',clientId:'marina',date:'2026-10-19',time:'10:00',duration:120,title:'Моя встреча',status:'confirmed'})
  const s=store(),after=populateSavedAccount(s,'example',before)
  expect(parsePractice(JSON.stringify(after))).toEqual(after);expect(after.appointments.some(a=>a.id==='session-upcoming-1')).toBe(false)
  expect((JSON.parse(s.getItem(moduleKey('payments'))!) as Payment[]).some(p=>p.appointmentId==='session-upcoming-1')).toBe(false)
  expect(populatedPractice(before).appointments.some(a=>a.id==='custom')).toBe(true)
 })
 it('never fills real accounts or a new onboarding workspace',()=>{
  const s=store(),empty=createEmptyPractice('Тест')
  for(const account of ['mine','local:email:test@example.com','example','member'])expect(populateSavedAccount(s,account,empty)).toBe(empty)
  for(const view of ['register','onboarding'])expect(populateShowcaseAccount(s,view,createExamplePractice()).clients).toHaveLength(3)
  expect(s.values.size).toBe(0)
 })
 it('upgrades the existing showcase scope without touching session or other scopes',()=>{
  const s=store();s.setItem('eh-product-v1-session','mine');s.setItem('eh-product-v2-mine-services','[]')
  const p=populateShowcaseAccount(s,'workspace',createExamplePractice())
  expect(p.clients).toHaveLength(24);expect(s.getItem('eh-product-v1-session')).toBe('mine');expect(s.getItem('eh-product-v2-mine-services')).toBe('[]');expect(s.getItem('eh-product-v2-showcase:workspace:v1-client-orders')).toBeTruthy()
 })
 it('leaves corrupt module storage recoverable and retries a partial write without duplication',()=>{
  const s=store();s.setItem(moduleKey('content'),'{broken')
  let writes=0;expect(()=>populateSavedAccount({...s,setItem:(k,v)=>{if(++writes===5)throw Error('Quota');s.setItem(k,v)}},'example',createExamplePractice())).toThrow('Quota')
  const after=populateSavedAccount(s,'example',createExamplePractice())
  expect(after.clients).toHaveLength(24);expect(s.getItem(moduleKey('content'))).toBe('{broken')
  const payments=JSON.parse(s.getItem(moduleKey('payments'))!) as Payment[];expect(new Set(payments.map(p=>p.id)).size).toBe(payments.length)
 })
})

it('upgrades older populated accounts with chart examples without resurrecting deleted clients',()=>{
 const s=store(),p=createMemberPractice();p.clients=p.clients.filter(c=>c.id!=='vera');p.appointments=p.appointments.filter(a=>a.clientId!=='vera')
 s.setItem('eh-product-v2-example-populated-2026-10-20-v2','complete')
 s.setItem(moduleKey('payments'),'[]')
 s.setItem(moduleKey('saved-astronomy-calculations'),JSON.stringify([{id:'user-chart',clientId:'marina',title:'Мой сохранённый разбор'}]))
 expect(populateSavedAccount(s,'example',p)).toEqual(p)
 const records=JSON.parse(s.getItem(moduleKey('saved-astronomy-calculations'))!)
 expect(records).toHaveLength(47);expect(records[0].title).toBe('Мой сохранённый разбор');expect(records.some((r:{clientId:string})=>r.clientId==='vera')).toBe(false)
 expect(s.getItem(moduleKey('payments'))).toBe('[]')
 s.setItem(moduleKey('saved-astronomy-calculations'),'[]');populateSavedAccount(s,'example',p)
 expect(s.getItem(moduleKey('saved-astronomy-calculations'))).toBe('[]')
})
