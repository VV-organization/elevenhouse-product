import {describe,it,expect} from 'vitest'
import {demoCalculate,demoCalendar,demoResolve,demoInterpret,exampleCalculationAdapters} from './calculationTemplates'
import {astrologyModes,type CalculationRequest} from '../state/calculationMethods'
import {validAstronomyResult} from '../state/calculationPresentation'
import {validateAstroCalendarData} from '../state/astroCalendar'
import {createMemberPractice} from '../state/memberCore'
const practice=createMemberPractice()
const birth=(i:number)=>{const c=practice.clients[i];return {date:c.birthDate,time:c.birthTime,place:c.birthPlace,unknownTime:c.unknownTime}}
const request:CalculationRequest={method:'astrology',mode:'composite',birth:birth(0),partner:birth(1),targetDate:'2026-10-15',targetPlace:'Москва',houseSystem:'Placidus',nodes:'mean',minorAspects:false,orbMultiplier:1}
describe('explicitly labelled calculation showcase',()=>{
 it.each(astrologyModes)('renders a complete %s template for every populated client',mode=>{
  for(let i=0;i<practice.clients.length;i++){
   const r=demoCalculate({...request,mode,birth:birth(i)})
   expect(r.status).toBe('ready');if(r.status!=='ready')continue
   expect(validAstronomyResult(r.result)).toBe(true)
   expect(r.result.notes?.[0].ru).toContain('Пример расчёта')
   expect(r.result.kind).toBe('astrology')
   if(r.result.kind==='astrology'){expect(r.result.aspects.length).toBeGreaterThan(0);expect(r.result.layers[0].positions.length).toBe(11);if(birth(i).unknownTime)expect(r.result.layers[0].cusps).toBeUndefined()}
  }
 })
 it.each(['bodygraph','pair','transits'])('populates %s with consistent gates and channels',mode=>{
  const r=demoCalculate({...request,method:'human-design',mode})
  expect(r.status).toBe('ready');if(r.status!=='ready'||r.result.kind!=='human-design')return
  expect(validAstronomyResult(r.result)).toBe(true)
  expect(r.result.charts).toHaveLength(mode==='pair'?2:1)
  for(const c of r.result.charts){expect(c.channels.length).toBeGreaterThan(0);expect(c.activations.length).toBeGreaterThanOrEqual(26);for(const ch of c.channels)expect(ch.gates.every(g=>c.activations.some(a=>a.gate===g))).toBe(true)}
 })
 it('is deterministic, reacts to inputs, and never impersonates an external adapter',()=>{
  expect(demoCalculate(request)).toEqual(demoCalculate(structuredClone(request)))
  expect(demoCalculate({...request,birth:birth(2)})).not.toEqual(demoCalculate(request))
  expect(exampleCalculationAdapters(false)).toEqual({})
  const calculate=()=>({status:'unavailable' as const,request,message:'real adapter'})
  expect(exampleCalculationAdapters(true,{calculate}).calculate).toBe(calculate)
 })
 it('validates missing/invalid inputs instead of returning a broken chart',()=>{
  expect(demoCalculate({...request,partner:undefined}).status).toBe('error')
  expect(demoCalculate({...request,birth:{...request.birth,date:'2026-02-30'}}).status).toBe('error')
 })
 it('provides calendar events with reopenable source charts',async()=>{
  const input={from:'2026-10-15',to:'2026-11-15',clients:practice.clients}
  const r=await demoCalendar(input);expect(r.status).toBe('ready');if(r.status!=='ready')return
  expect(validateAstroCalendarData(r,input)).toBe(true)
  expect(new Set(r.events.map(e=>e.type)).size).toBe(7)
  for(const e of r.events){const source=await demoResolve(e.calculationId!);expect(source?.id).toBe(e.calculationId);expect(source?.result.kind).toBe('astrology')}
  expect((await demoCalendar({...input,to:'2026-10-01'})).status).toBe('error')
 })
 it('provides drafts without preview labels in both languages',async()=>{
  for(const language of ['ru','en'] as const){const r=await demoInterpret({title:'Композит',result:demoCalculate(request),question:'Работа',language});expect(r.status).toBe('ready');if(r.status==='ready'){expect(r.text).not.toMatch(/демонстрац|demonstration|example/i);expect(r.text).toContain('Композит')}}
 })
})
