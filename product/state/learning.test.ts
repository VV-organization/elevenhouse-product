import {describe,it,expect} from 'vitest'
import {initialLearning,finishLearning,dismissLearning,showLearning} from './learning'
describe('context learning',()=>{
 it('does not interrupt an established account',()=>expect(showLearning(initialLearning(false),'appointment',null)).toBe(false))
 it('hides a dismissed tip without marking work complete',()=>{const s=dismissLearning(initialLearning(true),'appointment');expect(showLearning(s,'appointment',null)).toBe(false);expect(s.completed).toEqual([])})
 it('allows explicit replay after completion with other tips suppressed',()=>{const s=finishLearning(initialLearning(true),'appointment');expect(showLearning(s,'appointment',null)).toBe(false);expect(showLearning(s,'appointment','appointment')).toBe(true);expect(showLearning(s,'client','appointment')).toBe(false)})
 it('records successful steps idempotently',()=>{let s=finishLearning(initialLearning(true),'client');s=finishLearning(s,'client');expect(s.completed).toEqual(['client']);expect(showLearning(s,'appointment',null)).toBe(true)})
})
