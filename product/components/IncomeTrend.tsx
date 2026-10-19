import {useState,type CSSProperties,type KeyboardEvent} from 'react'
import {tr,localeTag} from '../i18n'
import {money} from '../modules/ModuleKit'
import {revenueSeries,type RevenuePoint} from './revenue-series'
import './income-trend.css'

type Comparison={points:RevenuePoint[];from:string;to:string}
export function IncomeTrend({points,from,to,comparison}:{points:RevenuePoint[];from:string;to:string;comparison?:Comparison}){
 const series=revenueSeries(points,from,to),prior=comparison?revenueSeries(comparison.points,comparison.from,comparison.to):[]
 const [selection,setSelection]=useState<string|null>(null)
 const peak=series.reduce((best,s,i)=>s.amount>series[best].amount?i:best,0)
 const selectedIndex=series.findIndex(s=>s.from===selection),index=selectedIndex<0?peak:selectedIndex
 const active=series[index],previous=prior[index]
 const maximum=Math.max(1,...series.map(s=>s.amount),...prior.map(s=>s.amount))
 const magnitude=10**Math.floor(Math.log10(maximum))
 const scale=[1,2,2.5,5,10].map(n=>n*magnitude).find(n=>n>=maximum)??maximum
 const date=(value:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'))
 const label=(s:typeof series[number])=>s.from===s.to?date(s.from):`${date(s.from)} – ${date(s.to)}`
 const hasData=series.some(s=>s.amount!==0)||prior.some(s=>s.amount!==0)
 function move(event:KeyboardEvent<HTMLButtonElement>,i:number){
  const next=event.key==='ArrowRight'?Math.min(series.length-1,i+1):event.key==='ArrowLeft'?Math.max(0,i-1):event.key==='Home'?0:event.key==='End'?series.length-1:-1
  if(next<0)return
  event.preventDefault();(event.currentTarget.parentElement?.children[next] as HTMLButtonElement|undefined)?.focus()
 }
 return <figure className="it-chart" aria-label={tr('Доход после комиссии по датам','Net income by date')}>
  <figcaption>
   <span className="it-selection" aria-live="polite">{active&&<><span>{label(active)}</span><strong>{money(active.amount)}</strong>{previous&&<small>{tr('Ранее','Previously')}: {money(previous.amount)} · {label(previous)}</small>}</>}</span>
   <span className="it-legend"><span><i/>{tr('Выбранный период','Selected period')}</span>{comparison&&<span><i className="it-prior-key"/>{tr('Предыдущий период','Previous period')}</span>}</span>
  </figcaption>
  {hasData?<>
   <div className="it-plot">
    <div className="it-axis" aria-hidden="true">{[1,.75,.5,.25,0].map(f=><span key={f}>{f?money(Math.round(scale*f)):'0'}</span>)}</div>
    <div className="it-canvas">
     <div className="it-grid" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i}/>)}</div>
     <div className="it-columns" style={{'--it-count':series.length} as CSSProperties}>
      {series.map((s,i)=><button key={s.from} type="button" tabIndex={index===i?0:-1} aria-label={`${label(s)}: ${money(s.amount)}${prior[i]?`; ${tr('предыдущий период','previous period')} ${label(prior[i])}: ${money(prior[i].amount)}`:''}`} aria-pressed={index===i} onClick={()=>setSelection(s.from)} onFocus={()=>setSelection(s.from)} onMouseEnter={()=>setSelection(s.from)} onKeyDown={e=>move(e,i)}>
       <span className="it-bar-pair" aria-hidden="true"><i className={`it-bar${s.amount===0?' is-zero':''}`} style={{height:`${Math.max(0,s.amount)/scale*100}%`}}/>{prior[i]&&<i className={`it-bar it-bar--prior${prior[i].amount===0?' is-zero':''}`} style={{height:`${Math.max(0,prior[i].amount)/scale*100}%`}}/>}</span>
      </button>)}
     </div>
    </div>
   </div>
   <div className="it-dates" aria-hidden="true"><span>{date(from)}</span><span>{series.length>2?date(series[Math.floor(series.length/2)].from):''}</span><span>{date(to)}</span></div>
   {comparison&&<p className="it-note">{tr('Сравнение по порядковому дню периода. Точные даты — у выбранного значения.','Compared by day within each period. Exact dates appear with the selected value.')}</p>}
  </>:<div className="it-empty">{tr('За выбранные периоды поступлений нет','No income in the selected periods')}</div>}
 </figure>
}
