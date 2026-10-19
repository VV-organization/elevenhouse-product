import {describe,it,expect} from 'vitest'
import {initialLearning} from './learning'
import {beginTour,moveTour,pauseTour,tourSteps,practiceDay} from './guidedTour'
describe('continuous product tour',()=>{
 it('starts after booking and reaches an explicit end without completing real tasks',()=>{
  let s=beginTour(initialLearning(true),'a1')
  expect(s.tour).toEqual({appointmentId:'a1',index:0,status:'active'})
  for(let i=1;i<tourSteps.length;i++){s=moveTour(s,1);expect(s.tour?.index).toBe(i);expect(s.tour?.status).toBe('active')}
  s=moveTour(s,1)
  expect(s.tour?.status).toBe('done');expect(s.completed).toEqual([])
  expect(beginTour(s,'a2')).toBe(s)
 })
 it('preserves pause and step through serialization, and resumes only explicitly',()=>{
  const s=JSON.parse(JSON.stringify(pauseTour(moveTour(beginTour(initialLearning(true),'a1'),1))))
  expect(beginTour(s,'a1')).toEqual(s)
  expect(beginTour(s,'a1',true).tour).toEqual({appointmentId:'a1',index:1,status:'active'})
 })
 it('does not auto start for established or previously paused accounts',()=>{
  const old=initialLearning(false);expect(beginTour(old,'a1')).toBe(old)
  const paused={...initialLearning(true),journey:{paused:true}};expect(beginTour(paused,'a1')).toBe(paused)
  expect(beginTour(old,'a1',true).tour?.status).toBe('active')
 })
 it('bounds Back and restarts a finished tour only through Help',()=>{
  let s=beginTour(initialLearning(true),'a1');expect(moveTour(s,-1).tour?.index).toBe(0)
  for(let i=0;i<tourSteps.length;i++)s=moveTour(s,1)
  expect(beginTour(s,'a1',true).tour?.index).toBe(0)
 })
 it('uses the practice timezone for real bookings while keeping demo fixtures stable',()=>{
  const now=new Date('2026-10-19T22:30:00Z')
  expect(practiceDay('Asia/Yekaterinburg',false,now)).toBe('2026-10-20')
  expect(practiceDay('America/New_York',false,now)).toBe('2026-10-19')
  expect(practiceDay('Asia/Yekaterinburg',true,now)).toBe('2026-10-15')
 })
})
