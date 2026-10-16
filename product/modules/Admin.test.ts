import { describe, expect, it } from 'vitest'
import { decideAdminCase, normalizeAdminCase, type Case } from './Admin'
const item:Case={id:'one',kind:'verification',person:'Анна',title:'Проверка',description:'',created:'15 октября',status:'open',decision:'',history:['Создано']}
describe('admin clarification lifecycle',()=>{
 it('keeps clarification open and preserves previous history',()=>{
  const next=decideAdminCase(item,'Вернуть на уточнение','Уточнить описание','Елена')
  expect(next.status).toBe('needs-info')
  expect(next.history).toEqual(['Создано','Вернуть на уточнение · Уточнить описание · Елена'])
  expect(item.status).toBe('open')
 })
 it('migrates only old incorrectly resolved clarification cases',()=>{
  const old={...item,status:'resolved' as const,decision:'Вернуть на уточнение: нужны данные'}
  expect(normalizeAdminCase(old).status).toBe('needs-info')
  expect(normalizeAdminCase(old).history).toEqual(old.history)
  const final={...old,decision:'Одобрить пример профиля: всё проверено'}
  expect(normalizeAdminCase(final)).toBe(final)
 })
 it('allows final decision after clarification without losing audit history',()=>{
  const requested=decideAdminCase(item,'Вернуть на уточнение','Нужны данные','Елена')
  const resolved=decideAdminCase(requested,'Одобрить пример профиля','Данные уточнены','Елена')
  expect(resolved.status).toBe('resolved')
  expect(resolved.history).toHaveLength(3)
  expect(normalizeAdminCase(resolved)).toBe(resolved)
 })
})
