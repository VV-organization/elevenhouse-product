import {describe,it,expect} from 'vitest'
import {buildFlowGraph,tracedGraphEdges} from './flow-graph'
import {freezeFlowRoutes,type Flow,type Trace} from './communication-workflows'
const flow:Flow={id:'f',name:'Branch',text:'',kind:'custom',status:'paused',trigger:'manual',entryId:'condition',steps:[
 {id:'condition',kind:'condition',value:'paid',branches:{yes:'yes',no:'no'}},
 {id:'yes',kind:'task',value:'Yes',next:'approval'},
 {id:'no',kind:'delay',value:'',amount:1,next:'approval'},
 {id:'approval',kind:'approval',value:'',next:'deliver'},
 {id:'deliver',kind:'deliver',value:'',next:null},
]}
describe('workflow graph represents saved routes',()=>{
 it('shows both branches, shared target, entry and end with non-overlapping cards',()=>{
  const g=buildFlowGraph(flow)
  expect(g.edges).toEqual(expect.arrayContaining([
   expect.objectContaining({from:'trigger',to:'step:condition',branch:'entry'}),
   expect.objectContaining({from:'step:condition',to:'step:yes',branch:'yes'}),
   expect.objectContaining({from:'step:condition',to:'step:no',branch:'no'}),
   expect.objectContaining({from:'step:deliver',to:'end',branch:'next'}),
  ]))
  expect(g.nodes.filter(n=>n.id==='step:approval')).toHaveLength(1)
  for(const a of g.nodes)for(const b of g.nodes)if(a!==b)expect(a.x+236<=b.x||b.x+236<=a.x||a.y+104<=b.y||b.y+104<=a.y).toBe(true)
 })
 it('keeps routes and chosen entry after visual list reorder',()=>{
  const fixed=freezeFlowRoutes(flow),changed={...fixed,steps:[...fixed.steps!].reverse()}
  const routes=(f:Flow)=>buildFlowGraph(f).edges.map(e=>`${e.from}/${e.branch}/${e.to}`).sort()
  expect(routes(changed)).toEqual(routes(fixed))
 })
 it('draws a bounded cycle without dropping its return edge',()=>{
  const g=buildFlowGraph({...flow,steps:[{id:'loop',kind:'condition',value:'paid',repeatLimit:2,branches:{yes:null,no:'loop'}}],entryId:'loop'})
  expect(g.edges.find(e=>e.branch==='no')).toMatchObject({from:'step:loop',to:'step:loop',back:true})
  expect(g.edges.every(e=>!e.path.includes('NaN'))).toBe(true)
 })
 it('shows a missing target as an error node instead of a valid finish',()=>{
  const g=buildFlowGraph({...flow,steps:[{id:'broken',kind:'task',value:'x',next:'gone'}],entryId:'broken'})
  expect(g.nodes).toEqual(expect.arrayContaining([expect.objectContaining({id:'missing:gone',kind:'missing'})]))
  expect(g.edges.find(e=>e.from==='step:broken')?.to).toBe('missing:gone')
 })
 it('highlights only traced transitions and stops at human approval',()=>{
  const g=buildFlowGraph(flow)
  const trace:Trace[]=[{stepId:'condition',status:'pass',text:'paid',conditionResult:true,nextId:'yes'},{stepId:'yes',status:'pass',text:'',nextId:'approval'},{stepId:'approval',status:'approval',text:'',nextId:'deliver'}]
  const ids=tracedGraphEdges(g,trace)
  const links=g.edges.filter(e=>ids.has(e.id))
  expect(links.map(e=>e.from)).toEqual(['trigger','step:condition','step:yes'])
  expect(links.some(e=>e.to==='step:no'||e.to==='step:deliver')).toBe(false)
 })
 it('does not animate a blocked validation or exhausted loop',()=>{
  const g=buildFlowGraph(flow)
  expect(tracedGraphEdges(g,[{stepId:'condition',status:'blocked',text:'configuration'}]).size).toBe(0)
 })
})
