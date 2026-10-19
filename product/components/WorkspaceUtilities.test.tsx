import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {NotificationLauncher,unreadNotificationCount} from './WorkspaceUtilities'

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
