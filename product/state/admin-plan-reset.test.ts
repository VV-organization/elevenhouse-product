import {describe,it,expect} from 'vitest'
import {factoryAdminPlans,planResetError,preparePlanReset} from './admin-plan-reset'
import {adminActionError,cancelAdminRequest,emptyAdminWorkspace} from './admin-workflows'
describe('factory plan reset preparation',()=>{
 it('matches original plan prices, limits and features without shared mutable defaults',()=>{
  const plans=factoryAdminPlans();expect(Object.keys(plans)).toEqual(['plan:start','plan:pro','plan:studio'])
  expect(plans['plan:start']).toMatchObject({price:0,priceYear:0,fee:8,bookings:30,aiLimit:20,automations:1})
  expect(plans['plan:pro']).toMatchObject({price:1990,priceYear:19100,fee:4,seats:1,popular:true})
  expect(plans['plan:studio']).toMatchObject({price:4990,priceYear:47900,fee:2,seats:5})
  expect(plans['plan:studio'].features).toContain('api');(plans['plan:pro'].features as string[]).push('changed');expect(factoryAdminPlans()['plan:pro'].features).not.toContain('changed')
 })
 it('snapshots confirmed and draft plans without applying changes and undo preserves subsequent edits',()=>{
  const state={...emptyAdminWorkspace(),drafts:{'plan:custom':{name:'Custom',fee:3},payout:{fee:4}}},confirmed={'plan:live':{name:'Live',fee:5},modules:{enabled:true}}
  const next=preparePlanReset(state,confirmed,{id:'reset',actor:'Admin',reason:'Review',createdAt:'2026-10-16'})
  expect(next.drafts).toEqual(state.drafts);expect(next.requests[0].status).toBe('prepared')
  state.drafts['plan:custom'].fee=9;confirmed['plan:live'].fee=10
  expect(next.requests[0].payload.previousDrafts).toEqual({'plan:custom':{name:'Custom',fee:3}})
  expect(next.requests[0].payload.previousConfirmed).toEqual({'plan:live':{name:'Live',fee:5}})
  const undone=cancelAdminRequest(next,'reset');expect(undone.requests[0].status).toBe('cancelled');expect(undone.drafts['plan:custom'].fee).toBe(9)
 })
 it('requires admin review, prevents conflicting pending changes and distinguishes unknown current plans',()=>{
  const next=preparePlanReset(emptyAdminWorkspace(),undefined,{id:'reset',actor:'Admin',reason:'Review',createdAt:'2026-10-16'})
  expect(next.requests[0].payload.previousConfirmed).toBeNull()
  expect(planResetError('moderator','reason',true,[])).toBe('permission')
  expect(planResetError('admin','reason',false,[])).toBe('review')
  expect(planResetError('admin','reason',true,next.requests)).toBe('conflict')
  expect(adminActionError('admin',{id:'plan:custom',name:'Custom',kind:'user'},'config',{},'Reason',next.requests)).toBe('duplicate')
  expect(planResetError('admin','reason',true,[{...next.requests[0],target:'plan:custom'}])).toBe('conflict')
  expect(planResetError('admin','reason',true,cancelAdminRequest(next,'reset').requests)).toBe('')
 })
})
