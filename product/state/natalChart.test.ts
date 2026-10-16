import {describe,it,expect} from 'vitest'
import {chartPoint,zodiacPosition,houseNumber,chartAspects,labelLongitudes,norm} from './natalChart'
import {marinaNatalReference as chart} from './natalReference'
describe('natal chart rendering integrity',()=>{
 it('anchors the ascendant on the left and increases houses counter-clockwise',()=>{expect(chartPoint(chart.ascendant,100,chart.ascendant).x).toBeCloseTo(220);expect(chartPoint(chart.ascendant,100,chart.ascendant).y).toBeCloseTo(320);expect(chartPoint(chart.cusps[1],100,chart.ascendant).y).toBeGreaterThan(320)})
 it('retains the verified Moon and ASC instead of the original invented values',()=>{expect(zodiacPosition(chart.planets[1].longitude)).toEqual({sign:6,text:'24°30′'});expect(zodiacPosition(chart.ascendant)).toEqual({sign:1,text:'21°46′'})})
 it('carries rounded minutes across signs without showing 60 minutes',()=>{expect(zodiacPosition(29.999)).toEqual({sign:1,text:'0°00′'});expect(zodiacPosition(359.999)).toEqual({sign:0,text:'0°00′'})})
 it('uses unequal cusp intervals including wraparound',()=>{expect(houseNumber(353.37,chart.cusps)).toBe(12);expect(houseNumber(10,chart.cusps)).toBe(12);expect(houseNumber(chart.cusps[0],chart.cusps)).toBe(1);expect(houseNumber(204.49,chart.cusps)).toBe(6);expect(houseNumber(10,[])).toBeNull()})
 it('derives aspects from actual longitudes, not displaced label positions',()=>{const aspects=chartAspects(chart.planets);expect(aspects.find(a=>a.a==='sun'&&a.b==='mercury')?.definition.key).toBe('conjunction');expect(aspects.find(a=>a.a==='moon'&&a.b==='saturn')?.definition.key).toBe('square');expect(aspects.find(a=>a.a==='sun'&&a.b==='moon')).toBeUndefined()})
 it('separates glyphs across the zodiac seam without mutating data',()=>{const before=JSON.stringify(chart);const labels=Object.values(labelLongitudes(chart.planets)).sort((a,b)=>a-b);labels.forEach((v,i)=>expect(norm(labels[(i+1)%labels.length]-v)).toBeGreaterThanOrEqual(11.999));expect(JSON.stringify(chart)).toBe(before)})
 it('preserves opposite house cusps and retrograde motion',()=>{chart.cusps.slice(0,6).forEach((v,i)=>expect(norm(chart.cusps[i+6]-v)).toBeCloseTo(180));expect(chart.planets.filter(p=>p.speed<0).map(p=>p.key)).toEqual(['pluto'])})
})
