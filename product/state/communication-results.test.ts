import {describe,it,expect} from 'vitest'
import {aiDefaults,aiConfigError,prepareAIRequest,usableAIResult} from './communication-ai'
import {reviewDistribution,confirmedReply,prepareReviewReply,calendarPublications,safeMetric} from './communication-results'
import {validateFlow,type Flow} from './communication-workflows'
describe('structured AI setup and external results',()=>{
 it('preserves legacy instructions and validates sources, configuration and variables',()=>{
  const c=aiDefaults('Brief for {{имя}}');expect(c.prompt).toBe('Brief for {{имя}}');expect(aiConfigError(c)).toBe('')
  expect(aiConfigError({...c,prompt:''})).toBe('prompt');expect(aiConfigError({...c,inputs:[]})).toBe('source');expect(aiConfigError({...c,prompt:'{{secret}}'})).toBe('variable');expect(aiConfigError({...c,model:'imaginary'})).toBe('option')
 })
 it('snapshots request inputs and never invents generation or applies a mismatched result',()=>{
  const c=aiDefaults('Draft'),r=prepareAIRequest('post-1',c,'Original text','req1','2026-10-16');c.prompt='Changed';c.inputs.push('history')
  expect(r.status).toBe('prepared');expect(r.config.prompt).toBe('Draft');expect(r.config.inputs).not.toContain('history');expect(usableAIResult(r,undefined)).toBe(false)
  expect(usableAIResult(r,{requestId:'other',status:'completed',text:'Result',receivedAt:'now'})).toBe(false)
  expect(usableAIResult({...r,status:'cancelled'},{requestId:'req1',status:'completed',text:'Result',receivedAt:'now'})).toBe(false)
  expect(usableAIResult(r,{requestId:'req1',status:'completed',text:'Result',receivedAt:'now'})).toBe(true)
 })
 it('requires review for confirm/edit AI and makes full-auto mode explicit',()=>{
  const flow:Flow={id:'f',name:'Flow',text:'',kind:'custom',trigger:'manual',status:'paused',steps:[{id:'ai',kind:'ai',value:'Draft',ai:aiDefaults('Draft'),next:'deliver'},{id:'deliver',kind:'deliver',value:'',next:null}]}
  expect(validateFlow(flow)).toBe('approval');flow.steps![0].ai!.hitl='edit';expect(validateFlow(flow)).toBe('approval');flow.steps![0].ai!.hitl='auto';expect(validateFlow(flow)).toBe('');flow.steps![0].ai!.inputs=[];expect(validateFlow(flow)).toBe('ai')
 })
})
describe('review publication lifecycle',()=>{
 it('counts only supplied published integer ratings',()=>{
  const reviews=[{id:'1',clientId:'c',text:'Text',response:'',rating:5,status:'published' as const},{id:'2',clientId:'c',text:'Text',response:'',rating:1,status:'pending' as const}]
  expect(reviewDistribution(reviews)).toEqual([{rating:5,count:1},{rating:4,count:0},{rating:3,count:0},{rating:2,count:0},{rating:1,count:0}])
 })
 it('prepares immutable text without claiming publication and blocks duplicate pending replies',()=>{
  const q=prepareReviewReply([],'r',' Original ','q','2026-10-16');expect(q[0].text).toBe('Original');expect(q[0].status).toBe('prepared');expect(confirmedReply('r',q,[])).toBeUndefined()
  expect(()=>prepareReviewReply(q,'r','New','q2','2026-10-16')).toThrow('pending')
  expect(confirmedReply('r',q,[{reviewId:'other',requestId:'q',status:'published',at:'now'}])).toBeUndefined()
  expect(confirmedReply('r',q,[{reviewId:'r',requestId:'q',status:'failed',at:'now'}])).toBeUndefined()
  expect(confirmedReply('r',q,[{reviewId:'r',requestId:'q',status:'published',at:'now'}])?.status).toBe('published')
  expect(prepareReviewReply([{...q[0],status:'cancelled'}],'r','New','q2','now')).toHaveLength(2)
 })
 it('orders local content plan chronologically and leaves absent metrics unknown',()=>{
  const p={title:'Post',text:'Text',date:'2026-10-16',time:'16:00',zone:'UTC',status:'draft'}
  expect(calendarPublications([{...p,id:'late'},{...p,id:'early',time:'10:00'},{...p,id:'next',date:'2026-11-01'}],'2026-10').map(p=>p.id)).toEqual(['early','late'])
  expect(safeMetric(undefined)).toBeNull();expect(safeMetric(-1)).toBeNull();expect(safeMetric(0)).toBe(0)
 })
})
