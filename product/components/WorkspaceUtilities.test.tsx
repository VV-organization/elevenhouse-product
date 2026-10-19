import {describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {NotificationLauncher,unreadNotificationCount,buildEntries} from './WorkspaceUtilities'

describe('workspace notification launcher',()=>{
 it('counts only unreviewed notification entries',()=>{
  const entries=[{id:'appointment-1',kind:'appointments'},{id:'message-1',kind:'messages'},{id:'client-1',kind:'clients'}]
  expect(unreadNotificationCount(entries,['appointment-1'])).toBe(1)
 })

 it('announces unread count and hides the badge when there is nothing new',()=>{
  const unread=renderToStaticMarkup(<NotificationLauncher count={3} onClick={()=>{}}/>),clear=renderToStaticMarkup(<NotificationLauncher count={0} onClick={()=>{}}/>)
  expect(unread).toContain('Уведомления, непрочитанных: 3')
  expect(unread).toContain('>3</span>')
  expect(clear).toContain('Уведомления')
  expect(clear).not.toContain('wu-unread-count')
 })
})

import {createMemberPractice} from '../state/memberAccount'
import type {Payment} from '../modules/ServicesFinance'
describe('notification event destinations',()=>{
 it('offers paid events only and targets the exact payment even without an appointment',()=>{
  const navigate=vi.fn(),practice=createMemberPractice()
  const payment:Payment={id:'payment-exact',clientId:'marina',serviceId:'s',serviceName:'Услуга',date:'2026-10-19',amount:1000,commission:0,status:'paid'}
  const rows=buildEntries({practice,onClient:()=>{},onMeeting:()=>{},onNavigate:navigate},{services:[],payments:[payment,{...payment,id:'pending',status:'pending'},{...payment,id:'refund',status:'refunded'}],orders:[],messages:{threads:{},drafts:{}},records:{}})
  expect(rows.filter(r=>r.popup).map(r=>r.id)).toEqual(['payment-payment-exact-paid'])
  rows.find(r=>r.id==='payment-payment-exact-paid')!.open()
  expect(navigate).toHaveBeenCalledWith('finance',{paymentId:'payment-exact',paymentClient:'marina'})
 })
 it('does not pop up a conversation that has already been answered',()=>{
  const rows=buildEntries({practice:createMemberPractice(),onClient:()=>{},onMeeting:()=>{},onNavigate:()=>{}},{services:[],payments:[],orders:[],messages:{threads:{marina:[{id:'in',from:'client',text:'Вопрос',time:'10:00',sentAt:'2026-10-19T10:00:00'},{id:'out',from:'you',text:'Ответ',time:'11:00',sentAt:'2026-10-19T11:00:00'}]},drafts:{}},records:{}})
  expect(rows.filter(r=>r.popup)).toEqual([])
  expect(rows.find(r=>r.id==='message-in')).toBeDefined()
 })
})
