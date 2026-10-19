import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {NotificationLauncher,initialNotificationReadIds,unreadNotificationCount} from './WorkspaceUtilities'

describe('workspace notification launcher',()=>{
 it('counts only unreviewed notification entries',()=>{
  const entries=[{id:'appointment-1',kind:'appointments'},{id:'message-1',kind:'messages'},{id:'client-1',kind:'clients'}]
  expect(unreadNotificationCount(entries,['appointment-1'])).toBe(1)
 })

 it('treats existing entries as seen on first setup so only later events are unread',()=>{
  const existing=[{id:'appointment-1',kind:'appointments'},{id:'payment-1',kind:'payments'},{id:'client-1',kind:'clients'}]
  const read=initialNotificationReadIds(existing)
  expect(read).toEqual(['appointment-1','payment-1'])
  expect(unreadNotificationCount([...existing,{id:'message-new',kind:'messages'}],read)).toBe(1)
 })

 it('announces unread count and hides the badge when there is nothing new',()=>{
  const unread=renderToStaticMarkup(<NotificationLauncher count={3} onClick={()=>{}}/>),clear=renderToStaticMarkup(<NotificationLauncher count={0} onClick={()=>{}}/>)
  expect(unread).toContain('Уведомления, непрочитанных: 3')
  expect(unread).toContain('>3</span>')
  expect(renderToStaticMarkup(<NotificationLauncher count={137} onClick={()=>{}}/>)).toContain('>137</span>')
  expect(clear).toContain('Уведомления')
  expect(clear).not.toContain('wu-unread-count')
 })
})
