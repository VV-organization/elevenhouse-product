import {describe,it,expect} from 'vitest'
import {revenueSeries} from './revenue-series'
describe('recorded revenue chart',()=>{
 it('keeps actual dates, combines same-day payments and excludes out-of-range data',()=>{
  const series=revenueSeries([{date:'2026-10-02',amount:4704},{date:'2026-10-02',amount:8544},{date:'2026-09-30',amount:900}], '2026-10-01','2026-10-03')
  expect(series.map(p=>p.amount)).toEqual([0,13248,0])
 })
 it('bounds long ranges and preserves amounts at both boundaries',()=>{
  const points=[{date:'2025-01-01',amount:123},{date:'2026-10-15',amount:456}]
  const series=revenueSeries(points,'2025-01-01','2026-10-15')
  expect(series.length).toBeLessThanOrEqual(31)
  expect(series.reduce((sum,p)=>sum+p.amount,0)).toBe(579)
  expect(series.at(-1)?.to).toBe('2026-10-15')
 })
 it('does not plot an invalid period',()=>expect(revenueSeries([],'2026-10-20','2026-10-15')).toEqual([]))
})
