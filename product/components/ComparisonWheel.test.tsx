import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {AstrologyResult} from '../state/calculationPresentation'
import {ComparisonWheel} from './ComparisonWheel'

const label=(ru:string)=>({ru,en:ru})
const result:AstrologyResult={
 kind:'astrology',title:label('Карта'),zodiac:label('Тропический'),houseSystem:'Placidus',
 layers:[{id:'natal',label:label('Первый'),utc:'1990-03-14T05:25:00Z',ascendant:35,
  positions:[{key:'sun',label:label('Солнце'),longitude:35},{key:'mercury',label:label('Меркурий'),longitude:36},{key:'moon',label:label('Луна'),longitude:125}],
 }],
 aspects:[
  {id:'sun-moon',from:{layer:'natal',planet:'sun'},to:{layer:'natal',planet:'moon'},label:label('Квадратура'),angle:90,orb:0,tone:'hard'},
  {id:'mercury-moon',from:{layer:'natal',planet:'mercury'},to:{layer:'natal',planet:'moon'},label:label('Квадратура'),angle:90,orb:1,tone:'hard'},
 ],
}
const render=(data=result,selected='',showAspects=true)=>renderToStaticMarkup(<ComparisonWheel result={data} selected={selected} showAspects={showAspects} onSelect={()=>{}}/>)
const coords=(html:string,id:string)=>{const tag=html.match(new RegExp(`<line[^>]+data-aspect="${id}"[^>]+>`))![0];return ['x1','y1','x2','y2'].map(attr=>Number(tag.match(new RegExp(`${attr}="([^"]+)"`))![1]))}
const longitude=(x:number,y:number)=>((Math.atan2(320-y,x-320)*180/Math.PI-180+35)%360+360)%360
describe('astrolabe data and interactions',()=>{
 it('keeps exact longitudes when neighboring planet glyphs are separated',()=>{
  const html=render(),sun=coords(html,'sun-moon'),mercury=coords(html,'mercury-moon')
  expect(longitude(sun[0],sun[1])).toBeCloseTo(35,8)
  expect(longitude(sun[2],sun[3])).toBeCloseTo(125,8)
  expect(longitude(mercury[0],mercury[1])).toBeCloseTo(36,8)
  expect(html).toContain('6°00′');expect(html).toContain('aria-pressed="false"')
 })
 it('filters aspects to the selected planet and preserves an explicit off state',()=>{
  const html=render(result,'natal:sun')
  expect(html).toContain('data-aspect="sun-moon"')
  expect(html).not.toContain('data-aspect="mercury-moon"')
  expect(html).toContain('aria-pressed="true"')
  expect(render(result,'',false)).not.toContain('data-aspect=')
  expect(render(result,'',false)).toContain('Солнце')
 })
 it('keeps cross-chart aspect ends in their own rings and never invents houses',()=>{
  const dual=structuredClone(result)
  dual.layers.push({id:'transit',label:label('Транзит'),utc:'2026-10-20T00:00:00Z',positions:[{key:'sun',label:label('Солнце'),longitude:125}]})
  dual.aspects=[{...result.aspects[0],to:{layer:'transit',planet:'sun'}}]
  const html=render(dual),c=coords(html,'sun-moon')
  expect(longitude(c[0],c[1])).toBeCloseTo(35,8)
  expect(longitude(c[2],c[3])).toBeCloseTo(125,8)
  expect(Math.hypot(c[0]-320,c[1]-320)).not.toBe(Math.hypot(c[2]-320,c[3]-320))
  expect(html).not.toContain('class="aw-house-number"')
 })
 it('keeps gradient references independent when chart and enlarged chart coexist',()=>{
  const html=renderToStaticMarkup(<><ComparisonWheel result={result} selected="" onSelect={()=>{}} showAspects/><ComparisonWheel result={result} selected="" onSelect={()=>{}} showAspects/></>)
  const ids=[...html.matchAll(/<(?:radialGradient|linearGradient) id="([^"]+)"/g)].map(match=>match[1])
  expect(ids.length).toBeGreaterThanOrEqual(4);expect(new Set(ids).size).toBe(ids.length)
  for(const id of ids)expect(html).toContain(`url(#${id})`)
 })
})
