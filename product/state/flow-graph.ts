import {flowTargets,type Flow,type Trace} from './communication-workflows'

export const FLOW_NODE_WIDTH=236
export const FLOW_NODE_HEIGHT=104
export type GraphNode={id:string;kind:'trigger'|'step'|'end'|'missing';stepId?:string;x:number;y:number}
export type GraphEdge={id:string;from:string;to:string;branch:'entry'|'next'|'yes'|'no';back:boolean;path:string;sx:number;sy:number;tx:number;ty:number;labelX:number;labelY:number}
export type FlowGraphModel={nodes:GraphNode[];edges:GraphEdge[];width:number;height:number}

/** Layout only. Saved routes and their order are never mutated. */
export function buildFlowGraph(flow:Flow):FlowGraphModel{
 const steps=flow.steps??[]
 const nodes:GraphNode[]=[{id:'trigger',kind:'trigger',x:0,y:0},...steps.map(s=>({id:`step:${s.id}`,kind:'step' as const,stepId:s.id,x:0,y:0}))]
 const known=new Set(steps.map(s=>s.id))
 function target(id:string|null){
  const key=id===null?'end':known.has(id)?`step:${id}`:`missing:${id}`
  if(!nodes.some(n=>n.id===key))nodes.push({id:key,kind:id===null?'end':known.has(id)?'step':'missing',x:0,y:0})
  return key
 }
 const raw:{from:string;to:string;branch:GraphEdge['branch']}[]=[{from:'trigger',to:target(flow.entryId??steps[0]?.id??null),branch:'entry'}]
 for(const step of steps){const routes=flowTargets(flow,step);for(const branch of step.kind==='condition'?['yes','no'] as const:['yes'] as const)raw.push({from:`step:${step.id}`,to:target(routes[branch]),branch:step.kind==='condition'?branch:'next'})}
 const edges:GraphEdge[]=raw.map((e,i)=>({...e,id:`edge-${i}`,back:false,path:'',sx:0,sy:0,tx:0,ty:0,labelX:0,labelY:0}))
 const outgoing=new Map(nodes.map(n=>[n.id,edges.filter(e=>e.from===n.id)]))
 const visited=new Set<string>(),active=new Set<string>(),order:string[]=[]
 function visit(id:string){if(visited.has(id))return;visited.add(id);active.add(id);for(const edge of outgoing.get(id)??[]){if(active.has(edge.to))edge.back=true;else visit(edge.to)}active.delete(id);order.push(id)}
 for(const node of nodes)visit(node.id)
 const ranks=new Map(nodes.map(n=>[n.id,n.id==='trigger'?0:1]))
 for(const id of order.reverse())for(const e of outgoing.get(id)??[])if(!e.back)ranks.set(e.to,Math.max(ranks.get(e.to)!,ranks.get(id)!+1))
 const columns=new Map<number,GraphNode[]>()
 for(const node of nodes){const rank=ranks.get(node.id)!;columns.set(rank,[...(columns.get(rank)??[]),node])}
 const lanes=Math.max(...[...columns.values()].map(col=>col.length)),top=80+edges.length*8
 for(const [rank,col] of columns)col.forEach((node,i)=>{node.x=40+rank*360;node.y=top+(lanes-col.length)*88+i*176})
 const byId=new Map(nodes.map(n=>[n.id,n]))
 edges.forEach((edge,i)=>{
  const from=byId.get(edge.from)!,to=byId.get(edge.to)!
  const sx=from.x+FLOW_NODE_WIDTH,sy=from.y+(edge.branch==='yes'?36:edge.branch==='no'?76:52),tx=to.x,ty=to.y+52
  const back=tx<=sx,detour=back||tx-sx>200,rail=24+i*8
  const path=detour?`M ${sx} ${sy} C ${sx+46} ${sy}, ${sx+46} ${rail}, ${sx+46} ${rail} L ${tx-36} ${rail} C ${tx-36} ${rail}, ${tx-36} ${ty}, ${tx} ${ty}`:`M ${sx} ${sy} C ${sx+62} ${sy}, ${tx-62} ${ty}, ${tx} ${ty}`
  Object.assign(edge,{back,path,sx,sy,tx,ty,labelX:sx+42,labelY:sy-12})
 })
 return {nodes,edges,width:Math.max(...nodes.map(n=>n.x))+FLOW_NODE_WIDTH+40,height:Math.max(380,...nodes.map(n=>n.y+FLOW_NODE_HEIGHT+64))}
}

/** A trace can expose the next step after approval without having traversed it. */
export function tracedGraphEdges(graph:FlowGraphModel,trace:Trace[]|null):Set<string>{
 const ids=new Set<string>()
 if(!trace?.length||trace[0].status==='blocked')return ids
 const entry=graph.edges.find(e=>e.branch==='entry'&&e.to===`step:${trace[0].stepId}`)
 if(entry)ids.add(entry.id)
 for(const row of trace){
  if(['approval','blocked','limit'].includes(row.status)||row.nextId===undefined)continue
  const target=row.nextId===null?'end':`step:${row.nextId}`
  const edge=graph.edges.find(e=>e.from===`step:${row.stepId}`&&e.to===target&&(row.conditionResult===undefined||e.branch===(row.conditionResult?'yes':'no')))
  if(edge)ids.add(edge.id)
 }
 return ids
}
