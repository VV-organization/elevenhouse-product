import {describe,it,expect} from 'vitest'
import {givenName,clientFullName,splitClientName} from './names'
import {upgradeSeedClientNames} from './memberAccount'
import {createMemberPractice} from './memberCore'

describe('personal names',()=>{
 it('uses only the given name in greetings',()=>{expect(givenName('  Анна  Соколова ')).toBe('Анна')})
 it('requires both parts and preserves compound surnames',()=>{
  expect(()=>clientFullName('Марина',' ')).toThrow('фамилию')
  expect(()=>clientFullName(' ','Иванова')).toThrow('имя')
  expect(clientFullName(' Марина ','Иванова-Петрова')).toBe('Марина Иванова-Петрова')
  expect(splitClientName('Марина Иванова-Петрова')).toEqual({firstName:'Марина',lastName:'Иванова-Петрова'})
 })
 it('upgrades existing seed clients without replacing edits or relationships',()=>{
  const practice=createMemberPractice();practice.clients[0].name='Марина';practice.clients[0].notes='Моя заметка';practice.clients[1].name='Дмитрий Зайцев'
  const upgraded=upgradeSeedClientNames(practice)
  expect(upgraded.clients[0].name).toBe('Марина Иванова')
  expect(upgraded.clients[0].notes).toBe('Моя заметка')
  expect(upgraded.clients[1].name).toBe('Дмитрий Зайцев')
  expect(upgraded.appointments).toEqual(practice.appointments)
  expect(upgradeSeedClientNames(upgraded)).toEqual(upgraded)
 })
})
