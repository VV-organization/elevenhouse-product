import {useEffect,useId,useMemo,useRef,useState,type CSSProperties} from 'react'
import {tr} from '../i18n'
import {buildFlowGraph,tracedGraphEdges,FLOW_NODE_WIDTH,FLOW_NODE_HEIGHT} from '../state/flow-graph'
import type {Flow,Trace} from '../state/communication-workflows'
import './flow-graph.css'

type Props={flow:Flow;selected:string|null;onSelect:(id:string)=>void;label:(id:string)=>string;triggerLabel:string;trace:Trace[]|null;runId?:number}
const categories=()=>({condition:tr('Условие','Condition'),delay:tr('Ожидание','Wait'),message:tr('Сообщение','Message'),task:tr('Действие','Action'),calculate:tr('Расчёт','Calculation'),ai:tr('AI-черновик','AI draft'),approval:tr('Согласование','Approval'),deliver:tr('Доставка','Delivery')})
function NodeSymbol({kind}:{kind:string}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">{kind==='condition'?<path d="m12 3 9 9-9 9-9-9Z"/>:kind==='delay'?<><circle cx="12" cy="12" r="8"/><path d="M12 7v5l4 2"/></>:kind==='approval'?<><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/></>:kind==='message'||kind==='deliver'?<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>:<><rect x="3" y="3" width="6" height="6" rx="2"/><rect x="15" y="15" width="6" height="6" rx="2"/><path d="M6 9v6a3 3 0 0 0 3 3h6M15 6h6m-3-3v6"/></>}</svg>}
export function FlowGraph({flow,selected,onSelect,label,triggerLabel,trace,runId=0}:Props){
 const graph=useMemo(()=>buildFlowGraph(flow),[flow])
 const traced=useMemo(()=>tracedGraphEdges(graph,trace),[graph,trace])
 const prefix=useId().replace(/:/g,'')
 const viewport=useRef<HTMLDivElement>(null)
 const [zoom,setZoom]=useState(1)
 const selectedId=selected==='__trigger__'?'trigger':selected?`step:${selected}`:null
 function fit(){if(viewport.current){setZoom(Math.min(1,(viewport.current.clientWidth-16)/graph.width,(viewport.current.clientHeight-16)/graph.height));viewport.current.scrollTo({left:0,top:0})}}
 useEffect(()=>{if(!runId)return;fit()},[runId])
 useEffect(()=>{
  if(!selectedId)return
  const node=graph.nodes.find(n=>n.id===selectedId);if(!node)return
  const nextZoom=zoom<.7?1:zoom;if(nextZoom!==zoom)setZoom(nextZoom)
  const frame=requestAnimationFrame(()=>viewport.current?.scrollTo({left:Math.max(0,node.x*nextZoom-36),top:Math.max(0,node.y*nextZoom-100)}))
  return()=>cancelAnimationFrame(frame)
 },[selectedId])
 const traceKey=String(runId)+JSON.stringify(trace)
 return <section className="eh-flow-graph" aria-label={tr('Схема сценария','Workflow diagram')}>
  <div className="eh-flow-toolbar"><span>{tr('Путь клиента','Client journey')}</span><div role="group" aria-label={tr('Масштаб схемы','Diagram zoom')}><button type="button" onClick={()=>setZoom(z=>Math.max(.5,z-.1))} disabled={zoom<=.501} aria-label={tr('Уменьшить схему','Zoom out')}>−</button><button type="button" className="eh-flow-zoom-reset" aria-label={tr('Масштаб 100%','Reset zoom to 100%')} onClick={()=>setZoom(1)}><output aria-live="polite">{Math.round(zoom*100)}%</output></button><button type="button" onClick={()=>setZoom(z=>Math.min(1.5,z+.1))} disabled={zoom>=1.499} aria-label={tr('Увеличить схему','Zoom in')}>+</button><button type="button" className="eh-flow-fit" onClick={fit}>{tr('Уместить','Fit')}</button></div></div>
  <div ref={viewport} className="eh-flow-viewport" tabIndex={0} aria-label={tr('Холст: прокрутите, чтобы увидеть остальные шаги','Canvas: scroll to see more steps')}>
   <div className="eh-flow-extent" style={{width:graph.width*zoom,height:graph.height*zoom}}>
    <div className="eh-flow-plane" style={{width:graph.width,height:graph.height,transform:`scale(${zoom})`}}>
     <svg className="eh-flow-wires" width={graph.width} height={graph.height} aria-hidden="true">
      <defs>{graph.edges.map((edge,i)=><linearGradient key={edge.id} id={`${prefix}-wire-${i}`} gradientUnits="userSpaceOnUse" x1={edge.sx} y1={edge.sy} x2={edge.tx} y2={edge.ty}><stop stopColor="var(--flow-light)"/><stop offset=".2" stopColor="var(--flow-wire)"/><stop offset=".8" stopColor="var(--flow-wire)"/><stop offset="1" stopColor="var(--flow-light)"/></linearGradient>)}</defs>
      {graph.edges.map((edge,i)=>{const chosen=edge.from===selectedId||edge.to===selectedId,passed=traced.has(edge.id);return <g key={edge.id} className={`eh-flow-connection${chosen?' is-selected':''}${passed?' is-traced':''}`} data-from={edge.from} data-to={edge.to} data-branch={edge.branch} style={{'--edge-paint':`url(#${prefix}-wire-${i})`} as CSSProperties}>
       <path className="eh-flow-wire-halo" d={edge.path}/><path className="eh-flow-wire-thread" d={edge.path} transform="translate(0,-3)"/><path className="eh-flow-wire-thread" d={edge.path} transform="translate(0,3)"/><path className="eh-flow-wire" d={edge.path}/>
       <path className="eh-flow-flare" d={`M ${edge.sx} ${edge.sy-10} C ${edge.sx+5} ${edge.sy-2}, ${edge.sx+16} ${edge.sy-1}, ${edge.sx+28} ${edge.sy} C ${edge.sx+16} ${edge.sy+1}, ${edge.sx+5} ${edge.sy+2}, ${edge.sx} ${edge.sy+10} Z`}/>
       <path className="eh-flow-flare" d={`M ${edge.tx} ${edge.ty-10} C ${edge.tx-5} ${edge.ty-2}, ${edge.tx-16} ${edge.ty-1}, ${edge.tx-28} ${edge.ty} C ${edge.tx-16} ${edge.ty+1}, ${edge.tx-5} ${edge.ty+2}, ${edge.tx} ${edge.ty+10} Z`}/>
       {passed&&<path key={traceKey} className="eh-flow-pulse" d={edge.path} pathLength="100" style={{animationDelay:`${Math.min([...traced].indexOf(edge.id)*.28,2)}s`}}/>}
       {(edge.branch==='yes'||edge.branch==='no')&&<g className="eh-flow-branch"><rect x={edge.labelX-17} y={edge.labelY-12} width="34" height="22" rx="7"/><text x={edge.labelX} y={edge.labelY+3} textAnchor="middle">{edge.branch==='yes'?tr('Да','Yes'):tr('Нет','No')}</text></g>}
      </g>})}
     </svg>
     {graph.nodes.map(node=>{
      const step=flow.steps?.find(s=>s.id===node.stepId),index=flow.steps?.findIndex(s=>s.id===node.stepId)??-1
      const actionable=node.kind==='trigger'||node.kind==='step'
      const title=node.kind==='trigger'?triggerLabel:node.kind==='end'?tr('Завершение','End'):node.kind==='missing'?tr('Шаг не найден','Step not found'):label(node.stepId!).replace(/^\d+\. /,'')
      const category=node.kind==='trigger'?tr('Событие','Trigger'):step?categories()[step.kind]:node.kind==='missing'?tr('Проверьте переход','Check transition'):tr('Конец маршрута','End of route')
      const row=trace?.filter(r=>r.stepId===node.stepId).at(-1),held=row&&['approval','blocked','limit'].includes(row.status)
      const className=`eh-flow-node${node.id===selectedId?' is-selected':''}${row?' is-visited':''}${node.kind==='missing'?' is-missing':''}${held?' is-held':''}`
      const style={left:node.x,top:node.y,width:FLOW_NODE_WIDTH,height:FLOW_NODE_HEIGHT}
      const content=<><span className="eh-flow-node-top"><NodeSymbol kind={step?.kind??node.kind}/><span>{category}</span><span className="eh-flow-node-number">{step?String(index+1).padStart(2,'0'):node.kind==='end'?'✓':'↗'}</span></span><strong>{title}</strong>{held&&<span className="eh-flow-hold">{row.status==='approval'?tr('Ждёт подтверждения','Awaiting approval'):tr('Проверка остановлена','Check stopped')}</span>}</>
      return actionable?<button key={node.id} type="button" className={className} style={style} data-node-id={node.id} aria-pressed={node.id===selectedId} aria-label={`${tr('Настроить: ','Configure: ')}${title}`} onClick={()=>onSelect(node.kind==='trigger'?'__trigger__':node.stepId!)} onFocus={event=>event.currentTarget.scrollIntoView({block:'nearest',inline:'nearest'})}>{content}</button>:<div key={node.id} className={className} style={style} data-node-id={node.id}>{content}</div>
     })}
    </div>
   </div>
  </div>
  <div className="eh-flow-caption"><span className="eh-flow-legend-line" aria-hidden="true"/>{trace?tr('Тестовый маршрут · действия не выполняются','Test route · no actions are executed'):tr('Выберите карточку, чтобы настроить шаг','Select a card to configure the step')}</div>
 </section>
}
