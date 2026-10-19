import {describe,it,expect} from 'vitest'
import {messagePreviews} from './messagePreviews'
import {createExamplePractice} from './model'
import type {ExternalMessageThread} from './communicationMessages'

describe('header message previews',()=>{
 const clients=createExamplePractice().clients.slice(0,3)
 it('uses the newest message across linked channels without exposing unlinked chats',()=>{
  const old={id:'old',from:'client' as const,text:'Old',time:'',sentAt:'2026-10-14T10:00'}
  const external:ExternalMessageThread={id:'telegram',name:'Chat',channel:'telegram',address:'@client',messages:[{id:'new',from:'you',text:'Reply',time:'',sentAt:'2026-10-15T12:00'}]}
  const unrelated:ExternalMessageThread={...external,id:'unlinked',messages:[{...old,id:'secret',text:'Unlinked'}]}
  const result=messagePreviews(clients,{[clients[0].id]:[old]}, {}, {[external.id]:{clientId:clients[0].id,thread:external}},[external,unrelated])
  expect(result).toHaveLength(1)
  expect(result[0].last?.text).toBe('Reply')
  expect(result[0].waiting).toBe(false)
 })
 it('preserves drafts and pending-reply state while sorting conversations by date',()=>{
  const result=messagePreviews(clients,{[clients[0].id]:[{id:'a',from:'client',text:'Earlier',time:'',sentAt:'2026-10-14T12:00'}],[clients[1].id]:[{id:'b',from:'client',text:'Recent',time:'',sentAt:'2026-10-15T12:00'}]},{[clients[0].id]:'Draft reply'}, {})
  expect(result.map(p=>p.client.id)).toEqual([clients[1].id,clients[0].id])
  expect(result[1].draft).toBe('Draft reply')
  expect(result[1].waiting).toBe(true)
 })
 it('includes draft-only conversations and omits clients without messages or drafts',()=>{
  const result=messagePreviews(clients,{}, {[clients[0].id]:'Unsent', [clients[1].id]:'   '}, {})
  expect(result).toHaveLength(1)
  expect(result[0].last).toBeUndefined()
  expect(result[0].waiting).toBe(false)
 })
})
