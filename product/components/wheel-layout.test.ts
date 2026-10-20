import {describe,it,expect} from 'vitest'
import type {AstroLayer} from '../state/calculationPresentation'
import {norm} from '../state/natalChart'
import {wheelLabels,wheelDegreeLabels} from './wheel-layout'
const layer=(angles:number[]):AstroLayer=>({id:'test',label:{ru:'Карта',en:'Chart'},utc:'2026-10-20T00:00:00Z',positions:angles.map((longitude,i)=>({key:String(i),longitude,label:{ru:String(i),en:String(i)}}))})
const delta=(a:number,b:number)=>norm(a-b+180)-180
describe('circular label spacing',()=>{
 it('balances crowded labels across zero without changing data or order',()=>{
  const data=layer([358,0,2]),original=structuredClone(data)
  const labels=wheelLabels(data,16)
  expect(data).toEqual(original)
  expect(labels.map(x=>x.p.key)).toEqual(['0','1','2'])
  expect(labels.map(x=>delta(x.display,x.p.longitude)).reduce((sum,n)=>sum+n,0)).toBeCloseTo(0)
  expect(norm(labels[1].display-labels[0].display)).toBeCloseTo(16)
  expect(norm(labels[2].display-labels[1].display)).toBeCloseTo(16)
 })
 it('leaves separated labels at their original longitudes',()=>{
  const labels=wheelLabels(layer([0,65,150,220,300]),16)
  labels.forEach(x=>expect(x.display).toBeCloseTo(x.p.longitude))
 })
 it('keeps wraparound separation for dense distributions',()=>{
  for(const angles of [Array.from({length:30},(_,i)=>i*12),Array.from({length:11},(_,i)=>i),[0,10,20,60,100,140,180,220,260,300,340]]){
   const labels=wheelLabels(layer(angles),18).sort((a,b)=>a.display-b.display)
   labels.forEach((x,i)=>expect(norm(labels[(i+1)%labels.length].display-x.display)).toBeGreaterThanOrEqual(Math.min(18,360/angles.length)-1e-8))
  }
 })
 it('places all captions in a two-ring chart without overlapping labels or glyphs',()=>{
  const points=[178,236].flatMap((radius,ring)=>Array.from({length:11},(_,i)=>{
   const angle=(i*360/11+ring*7)*Math.PI/180
   return {id:`${ring}:${i}`,x:320+radius*Math.cos(angle),y:320+radius*Math.sin(angle),text:i%3?'23°45′':'23°45′ R'}
  }))
  const original=structuredClone(points),labels=wheelDegreeLabels(points,142,9)
  expect(Object.keys(labels)).toHaveLength(22);expect(points).toEqual(original)
  const boxes=points.map(p=>({x:labels[p.id]!.x-p.text.length*9*.65/2,y:labels[p.id]!.y-10,w:p.text.length*9*.65,h:12}))
  const intersects=(a:typeof boxes[number],b:typeof a)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y
  boxes.forEach((box,i)=>{
   boxes.slice(i+1).forEach(other=>expect(intersects(box,other)).toBe(false))
   points.forEach(p=>expect(intersects(box,{x:p.x-20,y:p.y-20,w:40,h:40})).toBe(false))
  })
 })
})
