import {describe,it,expect} from 'vitest'
import {addContact,availableContacts,publicationDefaults,publicationError,flowDefaults,validateFlow,traceFlow,flowTargets,moveFlowStep,removeFlowStep,type Flow,reviewAverage,requestCandidates} from './communication-workflows'
describe('communication workflow preservation',()=>{
 it('retains publication fields and never invents publication success',()=>{const old={id:'p',title:'Title',text:'Body',date:'',time:'10:00',zone:'UTC',status:'draft',legacy:'keep'};expect(publicationDefaults(old)).toMatchObject({...old,audience:'public',mode:'draft'});expect(publicationDefaults(old).status).toBe('draft')})
 it('rejects invalid scheduled dates and empty destinations',()=>{const p=publicationDefaults({id:'p',title:'T',text:'B',date:'2026-02-30',time:'10:00',zone:'UTC',status:'draft',mode:'schedule'});expect(publicationError(p,'2026-01-01')).toBe('date');expect(publicationError({...p,date:'2026-99-99'},'2026-01-01')).toBe('date');expect(publicationError({...p,channels:[]},'2026-01-01')).toBe('channel')})
 it('merges current profile contacts without changing manually linked channels',()=>{const manual=[{id:'m',channel:'email' as const,address:'anna@example.com'}];expect(availableContacts(manual,{email:'anna@example.com',telegram:'@anna'})).toHaveLength(2);expect(manual).toHaveLength(1);expect(availableContacts([],{email:'new@example.com'})[0]).toMatchObject({address:'new@example.com',source:'profile'})})
 it('does not merge contacts by client name or duplicate an address',()=>{const a={id:'1',channel:'email' as const,address:'a@example.com'};expect(()=>addContact([a],{...a,id:'2',address:' A@example.com '})).toThrow('duplicate');expect(addContact([a],{id:'3',channel:'telegram',address:'anna'})).toHaveLength(2)})
 it('migrates old reminder text and keeps human approval before delivery',()=>{const f=flowDefaults({id:'f',name:'Reminder',text:'Hello',kind:'before',status:'ready',custom:'keep'});expect(f.custom).toBe('keep');expect(f.leadHours).toBe(24);expect(f.steps?.[0].amount).toBe(0);expect(f.steps?.[1].value).toBe('Hello');expect(validateFlow(f)).toBe('');expect(validateFlow({...f,steps:f.steps?.filter(s=>s.kind!=='approval')})).toBe('approval')})
 it('stops a failed condition and does not pretend external actions executed',()=>{const f=flowDefaults({id:'f',name:'Flow',text:'Hi',kind:'before',status:'paused',steps:[{id:'c',kind:'condition',value:'paid'},{id:'a',kind:'ai',value:'Summarize'}]});const ctx={name:'Anna',birthComplete:true,hasAppointment:true,completed:false,paid:false,subscribed:false};expect(traceFlow(f,ctx).map(s=>s.status)).toEqual(['stop']);expect(traceFlow(f,{...ctx,paid:true}).map(s=>s.status)).toEqual(['pass','external'])})
 it('does not assign invented ratings to migrated reviews',()=>{expect(reviewAverage([{id:'r',clientId:'a',text:'Great',response:''}])).toBeNull();expect(reviewAverage([{id:'r',clientId:'a',text:'Great',response:'',rating:5,status:'published'},{id:'s',clientId:'a',text:'Bad',response:'',rating:1,status:'hidden'}])).toBe(5)})
 it('requests reviews only for completed meetings without a request or linked review',()=>{expect(requestCandidates([{id:'a',clientId:'c',status:'completed'},{id:'b',clientId:'c',status:'confirmed'},{id:'c',clientId:'c',status:'completed'}],[],['c']).map(a=>a.id)).toEqual(['a'])})
})

const branchContext={name:'Anna',birthComplete:true,hasAppointment:true,completed:false,paid:true,subscribed:false}
function branched():Flow{return {id:'branches',name:'Branching',text:'',kind:'custom',status:'paused',trigger:'manual',steps:[
 {id:'condition',kind:'condition',value:'paid',branches:{yes:'paid-message',no:'reminder'}},
 {id:'paid-message',kind:'message',value:'Thanks, {name}',next:'approval'},
 {id:'reminder',kind:'message',value:'Please pay',next:'approval'},
 {id:'approval',kind:'approval',value:'',next:'deliver'},
 {id:'deliver',kind:'deliver',value:'',next:null}]}}
describe('branch-preserving workflows',()=>{
 it('traces the selected yes/no branch by identity and pauses at approval',()=>{
  const f=branched();expect(validateFlow(f)).toBe('')
  const yes=traceFlow(f,branchContext),no=traceFlow(f,{...branchContext,paid:false})
  expect(yes.map(r=>r.stepId)).toEqual(['condition','paid-message','approval'])
  expect(no.map(r=>r.stepId)).toEqual(['condition','reminder','approval'])
  expect(no[0]).toMatchObject({conditionResult:false,nextId:'reminder'})
  expect(yes[1].text).toBe('Thanks, Anna');expect(yes.at(-1)?.status).toBe('approval');expect(yes.some(r=>r.stepId==='deliver')).toBe(false)
 })
 it('checks approval on both branches, not merely preceding array positions',()=>{
  const f=branched();f.steps![0].branches!.no='deliver';expect(validateFlow(f)).toBe('approval');expect(traceFlow(f,branchContext)[0].status).toBe('blocked')
 })
 it('requires fresh approval when a result is changed after approval',()=>{
  const f=branched();f.steps![3].next='new-text';f.steps!.push({id:'new-text',kind:'ai',value:'Rewrite',next:'deliver'})
  expect(validateFlow(f)).toBe('approval')
 })
 it('rejects invalid identities and missing targets, including unused branches',()=>{
  const f=branched();f.steps![0].branches!.no='deleted';expect(validateFlow(f)).toBe('target')
  const duplicate=branched();duplicate.steps!.push({...duplicate.steps![0]});expect(validateFlow(duplicate)).toBe('identity')
 })
 it('preserves explicit and legacy links when list positions change',()=>{
  const f=branched(),moved=moveFlowStep(f,1,1);expect(moved.steps![1].id).toBe('reminder');expect(traceFlow(moved,branchContext).map(r=>r.stepId)).toEqual(['condition','paid-message','approval'])
  const legacy=flowDefaults({id:'f',name:'Reminder',text:'Hi',kind:'before',status:'paused'}),reordered=moveFlowStep(legacy,1,1)
  expect(reordered.entryId).toBe('f-delay');expect(flowTargets(reordered,reordered.steps!.find(s=>s.id==='f-delay')!).yes).toBe('f-message');expect(validateFlow(reordered)).toBe('')
 })
 it('prevents dangling links on delete and allows removal after redirecting references',()=>{
  const f=branched();expect(()=>removeFlowStep(f,'approval')).toThrow('referenced')
  f.steps![0].branches!.no='approval';const trimmed=removeFlowStep(f,'reminder');expect(trimmed.steps!.some(s=>s.id==='reminder')).toBe(false);expect(validateFlow(trimmed)).toBe('')
  const last:Flow={id:'f',name:'One',text:'',kind:'custom',status:'paused',trigger:'manual',steps:[{id:'one',kind:'task',value:'Task'}]};expect(removeFlowStep(last,'one').entryId).toBeUndefined()
 })
 it('retains bounded retry loops and terminates at the explicit repeat limit',()=>{
  const f:Flow={id:'retry',name:'Collect details',text:'',kind:'custom',status:'paused',trigger:'manual',steps:[
   {id:'check',kind:'condition',value:'birth-complete',repeatLimit:2,branches:{yes:null,no:'wait'}},
   {id:'wait',kind:'delay',value:'',amount:1,unit:'days',next:'check'}]}
  expect(validateFlow(f)).toBe('');const trace=traceFlow(f,{...branchContext,birthComplete:false})
  expect(trace.map(r=>r.stepId)).toEqual(['check','wait','check','wait','check','wait','check']);expect(trace.at(-1)?.status).toBe('limit')
  expect(traceFlow(f,branchContext)).toHaveLength(1)
  delete f.steps![0].repeatLimit;expect(validateFlow(f)).toBe('cycle');expect(traceFlow(f,branchContext)[0].status).toBe('blocked')
 })
 it('rejects an unbounded inner cycle even if another condition has a limit',()=>{
  const f=branched();f.steps![0].repeatLimit=2;f.steps![1].next='paid-message';expect(validateFlow(f)).toBe('cycle')
  const bad=branched();bad.steps![0].repeatLimit=11;expect(validateFlow(bad)).toBe('repeat')
 })
})
