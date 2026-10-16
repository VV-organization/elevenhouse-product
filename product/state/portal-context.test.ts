import {describe,it,expect} from 'vitest'
import {createExamplePractice} from './model'
import {resolvePortalContext} from './portal-context'
describe('portal specialist context',()=>{
 it('does not use the current practice for another selected specialist',()=>{expect(resolvePortalContext({activeAstrologerId:'other',clientId:'marina'},'account')).toBeNull()})
 it('isolates every specialist and client even if an adapter reuses its base scope',()=>{
  const practice=createExamplePractice();const a=resolvePortalContext({practice,activeAstrologerId:'a',clientId:'marina',moduleScope:'same'},'account');const b=resolvePortalContext({practice,activeAstrologerId:'b',clientId:'marina',moduleScope:'same'},'account');const c=resolvePortalContext({practice,activeAstrologerId:'a',clientId:'olga',moduleScope:'same'},'account');
  expect(a?.scope).not.toBe(b?.scope);expect(a?.scope).not.toBe(c?.scope);expect(a?.practice).toBe(practice)
 })
 it('rejects a client absent from the selected specialist practice',()=>{expect(resolvePortalContext({practice:createExamplePractice(),activeAstrologerId:'a',clientId:'foreign'},'account')).toBeNull()})
})
