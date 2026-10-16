import {describe, expect, it} from 'vitest'
import {birthDataError, birthDataOf, hasSavedNatalChart, resolveBirthDraft} from './calculationData'
import {createExamplePractice} from './model'
describe('calculation source data', () => {
  const client = createExamplePractice().clients[0]
  it('keeps the saved chart bound to its exact source data', () => {
    expect(hasSavedNatalChart(client, true)).toBe(true)
    for (const patch of [{birthDate:'1991-03-14'}, {birthTime:'08:26'}, {birthPlace:'Казань'}, {unknownTime:true}, {id:'another'}, {name:'Анна Иванова'}]) expect(hasSavedNatalChart({...client,...patch}, true)).toBe(false)
    expect(hasSavedNatalChart(client, false)).toBe(false)
  })
  it('accepts explicitly unknown time without inserting noon', () => {
    const data = birthDataOf({...client, unknownTime:true})
    expect(data.birthTime).toBe('')
    expect(birthDataError(data)).toBe('')
  })
  it('rejects normalized invalid dates, missing city and ambiguous time', () => {
    expect(birthDataError({...client, birthDate:'1990-02-31'})).toContain('дату')
    expect(birthDataError({...client, birthPlace:'  '})).toContain('город')
    expect(birthDataError({...client, birthTime:''})).toContain('время')
  })
  it('rejects a future birth date before saving or converting to a client', () => {
    expect(birthDataError({...client, birthDate:'2099-01-01'})).toContain('будущем')
  })
})

describe('birth input recovery', () => {
 const source = {birthDate:'1990-03-14',birthTime:'08:25',birthPlace:'Москва',unknownTime:false}
 const draft = {...source,birthPlace:'Казань'}
 it('recovers unfinished input when its original source is unchanged', () => {
   expect(resolveBirthDraft(source,{source,data:draft})).toEqual({data:draft,restored:true,conflict:false})
 })
 it('does not replace newer source data with an old draft', () => {
   const newer = {...source,birthTime:'09:00'}
   expect(resolveBirthDraft(newer,{source,data:draft})).toEqual({data:newer,restored:false,conflict:true})
 })
 it('uses the current source after save or discard', () => {
   expect(resolveBirthDraft(source).data).toEqual(source)
   expect(resolveBirthDraft(source,{source,data:source}).restored).toBe(false)
 })
})
