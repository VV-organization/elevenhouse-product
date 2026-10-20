import {describe,it,expect} from 'vitest'
import {selectPopupEvents,type PopupEvent} from './event-notifications'
const event=(id:string,kind:'payments'|'messages',date='2026-10-19',popup=true):PopupEvent=>({id,kind,date,popup,title:id,detail:'',open:()=>{}})
describe('event popup delivery',()=>{
 it('does not show existing unread history on entry',()=>{
  const entries=[event('p1','payments','2026-10-01'),event('p2','payments'),event('m1','messages')]
  expect(selectPopupEvents(entries,null,[],[]).map(e=>e.id)).toEqual([])
 })
 it('excludes ineligible, read and previously presented events',()=>{
  expect(selectPopupEvents([event('pending','payments','',false),event('read','messages'),event('shown','payments')],null,['read'],['shown'])).toEqual([])
 })
 it('delivers only newly added eligible events after the initial snapshot',()=>{
  const previous=new Set(['p-pending','m-old'])
  expect(selectPopupEvents([event('p-pending','payments','',false),event('p-paid','payments'),event('m-old','messages'),event('m-new','messages')],previous,[],[]).map(e=>e.id)).toEqual(['p-paid','m-new'])
 })
 it('never replays the rest of old history after dismissal',()=>{
  const entries=[event('p1','payments'),event('m1','messages')]
  expect(selectPopupEvents(entries,new Set(entries.map(e=>e.id)),[],['p1'])).toEqual([])
 })
})
import {updatePopupDelivery} from './event-notifications'
describe('durable popup queue',()=>{
 it('persists the initial baseline so reload does not surface older history',()=>{
  const entries=[event('old','payments','2026-10-01'),event('latest','payments')]
  const initial=updatePopupDelivery(entries,null,[])
  expect(initial.pending).toEqual([])
  const dismissed={...initial,pending:[]}
  expect(updatePopupDelivery(entries,JSON.parse(JSON.stringify(dismissed)),[])).toEqual(dismissed)
 })
 it('keeps unseen queued events through reload and removes read events',()=>{
  const entries=[event('p','payments'),event('a','messages'),event('b','messages')]
  const state=updatePopupDelivery(entries,{known:[],pending:[]},[])
  expect(state.pending).toHaveLength(2)
  expect(updatePopupDelivery(entries,JSON.parse(JSON.stringify(state)),['a']).pending).toEqual(['b'])
 })
})

describe('popup bursts',()=>{it('keeps only two fresh cards instead of draining a historical backlog',()=>{const entries=[event('a','messages'),event('b','messages'),event('c','payments')];const state=updatePopupDelivery(entries,{known:[],pending:[]},[]);expect(state.pending).toEqual(['b','c']);expect(updatePopupDelivery(entries,{...state,pending:[]},[]).pending).toEqual([])})})
