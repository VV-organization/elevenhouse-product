import {useState} from 'react'
import {tr,localeTag} from '../i18n'
import {money} from '../modules/ModuleKit'
import {revenueSeries,type RevenuePoint} from './revenue-series'
import './revenue-chart.css'

export function RevenueChart({points,from,to,label}:{points:RevenuePoint[];from:string;to:string;label:string}){
 const series=revenueSeries(points,from,to)
 const [selected,setSelected]=useState<string|null>(null)
 const active=series.find(s=>s.from===selected)
 const max=Math.max(1,...series.map(s=>s.amount))
 const date=(value:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'))
 const period=(s:typeof series[number])=>s.from===s.to?date(s.from):`${date(s.from)} – ${date(s.to)}`
 return <figure className="rv-chart" aria-label={label}>
  <figcaption><span>{label}</span><span aria-live="polite">{active?<><b>{money(active.amount)}</b> · {period(active)}</>:tr('По отмеченным оплатам','Based on recorded payments')}</span></figcaption>
  {series.length&&points.some(p=>p.amount!==0&&p.date>=from&&p.date<=to)?<>
   <div className="rv-plot"><div className="rv-axis" aria-hidden="true"><span>{money(max)}</span><span>{money(Math.round(max/2))}</span><span>0</span></div><div className="rv-columns">{series.map((s,i)=><button key={s.from} type="button" aria-label={`${period(s)}: ${money(s.amount)}`} aria-pressed={selected===s.from} onClick={()=>setSelected(s.from)} className={`rv-column${s.amount===max?' is-peak':''}`}><svg viewBox="0 0 24 120" preserveAspectRatio="none" aria-hidden="true"><rect x="3" y={120-Math.max(0,s.amount/max*116)} width="18" height={Math.max(0,s.amount/max*116)} rx="3"/></svg><span className="rv-tick" aria-hidden="true">{i===0||i===series.length-1||i===Math.floor(series.length/2)?date(s.from):''}</span></button>)}</div></div>
  </>:<div className="rv-empty">{tr('За этот период поступлений нет','No income in this period')}</div>}
 </figure>
}
