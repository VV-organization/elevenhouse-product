import {describe,it,expect} from 'vitest'
import {filterClients} from './clientSearch'
import {createExamplePractice} from './model'
describe('client search',()=>{
 const clients=createExamplePractice().clients
 it('finds names and surnames regardless of case, order and extra spaces',()=>{
  expect(filterClients(clients,'  ПЕТРОВ дми ').map(c=>c.id)).toEqual(['dmitry'])
  expect(filterClients(clients,'мар ива').map(c=>c.id)).toEqual(['marina'])
 })
 it('treats е and ё as equivalents and keeps both people with the same name',()=>{
  const items=[{...clients[0],id:'one',name:'Алёна Фёдорова'},{...clients[0],id:'two',name:'Алёна Иванова'}]
  expect(filterClients(items,'алена')).toHaveLength(2)
  expect(filterClients(items,'фед')).toHaveLength(1)
 })
 it('sorts the directory alphabetically without mutating the source; missing results stay empty',()=>{
  expect(filterClients(clients,'').map(c=>c.id)).toEqual(['dmitry','marina','olga'])
  expect(clients[0].id).toBe('marina')
  expect(filterClients(clients,'несуществующий')).toEqual([])
 })
})
