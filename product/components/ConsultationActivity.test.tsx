import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {Practice} from '../state/model'
import {consultationDays,ConsultationActivity} from './ConsultationActivity'

const appointment=(date:string,status='completed')=>({date,status}) as Practice['appointments'][number]
describe('month-to-date consultation activity',()=>{
 it('counts only completed meetings through today and preserves zero days',()=>{
  const days=consultationDays([
   appointment('2026-10-01'),appointment('2026-10-01'),
   appointment('2026-10-03'),appointment('2026-10-02','cancelled'),
   appointment('2026-10-02','confirmed'),appointment('2026-09-30'),
   appointment('2026-10-04'),
  ],'2026-10-03')
  expect(days).toEqual([
   {date:'2026-10-01',count:2},{date:'2026-10-02',count:0},{date:'2026-10-03',count:1},
  ])
 })
 it('uses a textual empty state without invented activity',()=>{
  const html=renderToStaticMarkup(<ConsultationActivity appointments={[]} today="2026-10-01"/>)
  expect(html).not.toContain('<svg')
  expect(html).toContain('pd-consultation-empty')
 })
 it('handles leap-day month boundaries',()=>{
  expect(consultationDays([appointment('2024-02-29')],'2024-02-29')).toHaveLength(29)
  expect(consultationDays([appointment('2024-02-29')],'2024-03-01')).toEqual([{date:'2024-03-01',count:0}])
 })
})
