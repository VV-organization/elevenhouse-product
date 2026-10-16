import {describe,it,expect} from 'vitest'
import {briefMatches,validSky,validApproval,decisionKey,type Approval} from './today-workbench'
import type {Practice} from './model'
const practice={clients:[{id:'a'},{id:'b'}],appointments:[{id:'m',clientId:'a'}]} as Practice
describe('working day evidence',()=>{
 it('does not reuse another date or an unverified moon phase',()=>{
  const sky={date:'2026-10-16',phase:'Full',sign:'Aries',source:'Provider',illumination:99,transits:[]}
  expect(validSky(sky,'2026-10-16')).toBe(true)
  expect(validSky(sky,'2026-10-17')).toBe(false)
  expect(validSky({...sky,source:''},sky.date)).toBe(false)
  expect(validSky({...sky,illumination:101},sky.date)).toBe(false)
 })
 it('only attaches a brief to its exact client and appointment',()=>{
  const b={id:'b1',appointmentId:'m',clientId:'a',text:'Prepared text',source:'Provider',generatedAt:'2026-10-16T10:00:00Z'}
  expect(briefMatches(b,'m',practice)).toBe(true)
  expect(briefMatches({...b,clientId:'b'},'m',practice)).toBe(false)
  expect(briefMatches({...b,appointmentId:'other'},'m',practice)).toBe(false)
  expect(briefMatches({...b,source:''},'m',practice)).toBe(false)
 })
 it('does not accept approvals with a different client meeting',()=>{
  const a:Approval={id:'a1',revision:'1',title:'Review',description:'',clientId:'a',appointmentId:'m',kind:'message',recipient:'Client a',content:'Draft',status:'pending',createdAt:'2026-10-16'}
  expect(validApproval(a,practice)).toBe(true)
  expect(validApproval({...a,clientId:'b'},practice)).toBe(false)
  expect(validApproval({...a,recipient:''},practice)).toBe(false)
  expect(decisionKey(a)).not.toBe(decisionKey({...a,revision:'2'}))
 })
})
