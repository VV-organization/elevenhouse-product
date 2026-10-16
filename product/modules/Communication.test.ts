import { describe, expect, it } from 'vitest'
import { prepareScenarioPreview, birthTimeReply } from './Communication'
import { createExamplePractice } from '../state/model'
const practice=createExamplePractice()
const marina=practice.clients.find(c=>c.id==='marina')!
const dmitry=practice.clients.find(c=>c.id==='dmitry')!
const appointment=practice.appointments.find(a=>a.clientId==='marina')!
describe('communication drafts preserve client context',()=>{
 it('uses the selected appointment and name in a reminder',()=>{
  const text=prepareScenarioPreview('before','{имя}: {дата}, {время}',marina,appointment)
  expect(text).toContain('Марина');expect(text).toContain(appointment.time);expect(text).not.toContain('{дата}')
 })
 it('does not prepare a reminder from another client’s appointment',()=>{
  expect(()=>prepareScenarioPreview('before','Reminder',dmitry,appointment)).toThrow('нет подтверждённой')
 })
 it('does not create an after-meeting message before completion',()=>{
  expect(()=>prepareScenarioPreview('after','Follow-up',marina,appointment)).toThrow('нет завершённой')
  expect(prepareScenarioPreview('after','Здравствуйте, {имя}',marina,{...appointment,status:'completed'})).toBe('Здравствуйте, Марина')
 })
 it('does not request birth details when they are already complete',()=>{
  expect(()=>prepareScenarioPreview('data','Details',marina)).toThrow('уже заполнены')
  expect(prepareScenarioPreview('data','Здравствуйте, {имя}',dmitry)).toBe('Здравствуйте, Дмитрий')
 })
 it('unknown birth time answer explains limitations without inventing time',()=>{
  const text=birthTimeReply(dmitry)
  expect(text).toContain('время неизвестно');expect(text).toContain('нельзя считать надёжными');expect(text).toContain('ничего придумывать не нужно')
 })
})
