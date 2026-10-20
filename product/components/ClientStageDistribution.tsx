import {useState,type CSSProperties} from 'react'
import {tr,localeTag} from '../i18n'
import {Icon} from './Icon'
import './client-stage-distribution.css'

type Stage={id:string;label:string;count:number;href?:string}
/** Momentum's segmented distribution: area represents count; the list keeps exact values. */
export function ClientStageDistribution({stages}:{stages:Stage[]}){
 const [active,setActive]=useState<string|null>(null)
 const order=['new','active','paused','archived']
 const rows=stages.filter(s=>s.count>0).sort((a,b)=>(order.includes(a.id)?order.indexOf(a.id):4)-(order.includes(b.id)?order.indexOf(b.id):4)),total=rows.reduce((sum,s)=>sum+s.count,0)
 const stageColor=(id:string)=>`var(--data-series-${order.includes(id)?order.indexOf(id)+1:5})`
 const leading=rows.reduce<Stage|undefined>((best,s)=>!best||s.count>best.count?s:best,undefined)
 const percent=(count:number)=>(count/total*100).toLocaleString(localeTag(),{maximumFractionDigits:1})+'%'
 if(!total)return <p className="cs-empty">{tr('Распределение появится после добавления клиентов.','The breakdown appears when clients are added.')}</p>
 const content=(stage:Stage)=><><i className="cs-key" aria-hidden="true"/><span className="cs-stage-name">{stage.label}</span><strong>{stage.count.toLocaleString(localeTag())}</strong><small>{percent(stage.count)}</small>{stage.href&&<Icon name="arrow" size={14}/>}</>
 return <div className="cs-distribution">
  <div className="cs-summary"><div><strong>{total.toLocaleString(localeTag())}</strong><span>{tr('Всего клиентов','Total clients')}</span></div>{leading&&<div className="cs-leading"><strong>{percent(leading.count)}</strong><span>{leading.label}</span></div>}</div>
  <div className="cs-band" aria-hidden="true" data-exploring={active!==null}>{rows.map(s=><span key={s.id} data-active={active===s.id} style={{flex:s.count,'--cs-color':stageColor(s.id)} as CSSProperties}/>)}</div>
  <ul className="cs-stages" onMouseLeave={()=>setActive(null)}>{rows.map(s=><li key={s.id} style={{'--cs-color':stageColor(s.id)} as CSSProperties} onMouseEnter={()=>setActive(s.id)}>
   {s.href?<a href={s.href} onFocus={()=>setActive(s.id)} onBlur={()=>setActive(null)} aria-label={`${s.label}: ${s.count}, ${percent(s.count)}. ${tr('Показать клиентов','Show clients')}`}>{content(s)}</a>:<div className="cs-stage-row">{content(s)}</div>}
  </li>)}</ul>
 </div>
}
