import { describe, it, expect } from 'vitest'
import { meetingGroups, reminderOrder, messageOrderKey, postOrder } from './ordering'
const row = (id:string,date:string,time='12:00',status='confirmed') => ({id,date,time,status})
describe('list chronology independent of insertion order',()=>{
 it('puts nearest future meetings first and newest history first, without changing saved arrays',()=>{
  const items=[row('old','2026-08-03','12:00','completed'),row('far','2026-11-01'),row('recent','2026-10-14','10:00','completed'),row('today-late','2026-10-15','16:00'),row('today-early','2026-10-15','09:00'),row('recent-late','2026-10-14','18:00','completed')]
  const groups=meetingGroups(items)
  expect(groups.upcoming.map(x=>x.id)).toEqual(['today-early','today-late','far'])
  expect(groups.history.map(x=>x.id)).toEqual(['recent-late','recent','old'])
  expect(items[0].id).toBe('old')
 })
 it('does not promote cancelled, completed or past unclosed meetings to the upcoming card',()=>{
  const items=[row('past','2026-10-01'),row('cancel','2026-10-20','11:00','cancelled'),row('done','2026-10-15','10:00','completed'),row('pending','2026-10-16','10:00','pending')]
  const groups=meetingGroups(items)
  expect(groups.upcoming.map(x=>x.id)).toEqual(['pending'])
  expect(groups.history.map(x=>x.id)).toEqual(['cancel','done','past'])
  expect(groups.history.at(-1)?.status).toBe('confirmed')
 })
 it('keeps overdue and upcoming reminders above completed reminders, whose history is newest first',()=>{
  const items=[{...row('old-done','2026-08-01'),done:true},{...row('future','2026-10-20'),done:false},{...row('recent-done','2026-10-14'),done:true},{...row('overdue','2026-10-13'),done:false}]
  expect(items.sort(reminderOrder).map(x=>x.id)).toEqual(['overdue','future','recent-done','old-done'])
 })
 it('orders legacy conversations by actual day and time rather than Russian date text',()=>{
  const messages=[{time:'30 сентября · 17:20'},{time:'15 октября · 08:50'},{time:'15 октября · 09:05'},{time:'2 октября · 12:00'}]
  expect(messages.sort((a,b)=>messageOrderKey(b).localeCompare(messageOrderKey(a))).map(x=>x.time)).toEqual(['15 октября · 09:05','15 октября · 08:50','2 октября · 12:00','30 сентября · 17:20'])
  expect(messageOrderKey({time:'15 октября'})).toBe('2026-10-15T00:00')
  expect(messageOrderKey()).toBe('')
 })
 it('uses precise persisted timestamps for new messages including across years',()=>{
  expect(messageOrderKey({time:'1 января',sentAt:'2027-01-01T10:00:00'})).toBe('2027-01-01T10:00:00')
  expect(messageOrderKey({time:'31 декабря 2025 · 09:30'})).toBe('2025-12-31T09:30')
 })
 it('keeps edited drafts first and planned publications in upcoming order',()=>{
  const items=[{...row('later','2026-11-01','12:00','scheduled')},{...row('old-draft','','','draft')},{...row('earlier','2026-10-16','12:00','scheduled')},{...row('edited','','','draft'),updatedAt:'2026-10-15T12:00:00Z'}]
  expect(items.sort(postOrder).map(x=>x.id)).toEqual(['edited','old-draft','earlier','later'])
 })
})
