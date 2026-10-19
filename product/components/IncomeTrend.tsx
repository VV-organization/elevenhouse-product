import {useId,useState} from 'react'
import {tr,localeTag} from '../i18n'
import {money} from '../modules/ModuleKit'
import {revenueSeries,type RevenuePoint} from './revenue-series'
import './income-trend.css'

type Comparison={points:RevenuePoint[];from:string;to:string}
export function IncomeTrend({points,from,to,comparison}:{points:RevenuePoint[];from:string;to:string;comparison?:Comparison}){
 const series=revenueSeries(points,from,to),prior=comparison?revenueSeries(comparison.points,comparison.from,comparison.to):[]
 const [selection,setSelection]=useState<string|null>(null)
 const pattern=useId().replace(/:/g,'')
 const peak=series.reduce((best,s,i)=>s.amount>series[best].amount?i:best,0)
 const selectedIndex=series.findIndex(s=>s.from===selection),index=selectedIndex<0?peak:selectedIndex
 const active=series[index],previous=prior[index]
 const max=Math.max(1,...series.map(s=>s.amount),...prior.map(s=>s.amount))
 const x=(i:number)=>series.length<=1?500:i/(series.length-1)*1000
 const y=(amount:number)=>180-amount/max*156
 const path=(values:typeof series)=>values.map((s,i)=>`${i?'L':'M'}${x(i)},${y(s.amount)}`).join(' ')
 const currentPath=path(series),previousPath=path(prior)
 const date=(value:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'))
 const label=(s:typeof series[number])=>s.from===s.to?date(s.from):`${date(s.from)} – ${date(s.to)}`
 const hasData=series.some(s=>s.amount!==0)||prior.some(s=>s.amount!==0)
 return <figure className="it-chart" aria-label={tr('Доход после комиссии по датам','Net income by date')}>
  <figcaption><span className="it-legend"><span><i/>{tr('Выбранный период','Selected period')}</span>{comparison&&<span><i className="it-prior-key"/>{tr('Предыдущий период','Previous period')}</span>}</span><span className="it-selection" aria-live="polite">{active&&<><strong>{money(active.amount)}</strong><span>{label(active)}{previous&&<> · {tr('ранее','previously')} {money(previous.amount)} ({label(previous)})</>}</span></>}</span></figcaption>
  {hasData?<><div className="it-plot"><div className="it-axis" aria-hidden="true"><span>{money(max)}</span><span>{money(Math.round(max/2))}</span><span>0</span></div><div className="it-canvas"><svg viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id={pattern} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><line x1="0" y1="0" x2="0" y2="9" className="it-hatch"/></pattern></defs><path className="it-grid" d="M0,24 H1000 M0,102 H1000 M0,180 H1000"/>{comparison&&prior.length===series.length?<path fill={`url(#${pattern})`} d={`${currentPath} ${[...prior].reverse().map((s,i)=>`L${x(prior.length-1-i)},${y(s.amount)}`).join(' ')} Z`}/>:<path className="it-area" d={`${currentPath} L${x(series.length-1)},180 L${x(0)},180 Z`}/>}{comparison&&<path className="it-prior-line" d={previousPath}/>}<path className="it-current-line" d={currentPath}/>{active&&<><path className="it-marker" d={`M${x(index)},16 V184`}/><circle className="it-point" cx={x(index)} cy={y(active.amount)} r="5" vectorEffect="non-scaling-stroke"/></>}</svg><div className="it-targets">{series.map((s,i)=><button key={s.from} type="button" aria-label={`${label(s)}: ${money(s.amount)}${prior[i]?`; ${tr('предыдущий период','previous period')} ${label(prior[i])}: ${money(prior[i].amount)}`:''}`} aria-pressed={index===i} onClick={()=>setSelection(s.from)} onFocus={()=>setSelection(s.from)} onMouseEnter={()=>setSelection(s.from)} style={{left:`${series.length<=1?0:Math.max(0,Math.min(100-100/series.length,i/(series.length-1)*100-50/series.length))}%`,width:`${100/series.length}%`}}/>)}</div></div></div><div className="it-dates" aria-hidden="true"><span>{date(from)}</span><span>{series.length>2?date(series[Math.floor(series.length/2)].from):''}</span><span>{date(to)}</span></div>{comparison&&<p className="it-note">{tr('Сравнение по порядковому дню периода. Точные даты — у выбранного значения.','Compared by day within each period. Exact dates appear with the selected value.')}</p>}</>:<div className="it-empty">{tr('За выбранные периоды поступлений нет','No income in the selected periods')}</div>}
 </figure>
}
