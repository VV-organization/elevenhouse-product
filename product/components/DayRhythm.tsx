import {useState} from 'react'
import {tr} from '../i18n'
import {appointmentStatusLabel,type Appointment,type Practice} from '../state/model'
import {timeMinutes,clockTime,appointmentLanes} from './weekly-layout'
import './day-rhythm.css'

export function dayRhythm(appointments:Appointment[],date:string){
 const items=appointments.filter(a=>a.date===date&&a.status!=='cancelled').sort((a,b)=>a.time.localeCompare(b.time))
 const start=Math.min(9*60,...items.map(a=>Math.floor(timeMinutes(a.time)/60)*60))
 const end=Math.max(18*60,...items.map(a=>Math.ceil((timeMinutes(a.time)+a.duration)/60)*60))
 return {items,start,end,minutes:items.reduce((sum,a)=>sum+a.duration,0),lanes:appointmentLanes(items)}
}

/** G-med calendar reference: a time grid with duration blocks, reduced to one horizontal day. */
export function DayRhythm({practice,date,onOpen}:{practice:Practice;date:string;onOpen:(id:string)=>void}){
 const {items,start,end,minutes,lanes}=dayRhythm(practice.appointments,date)
 const [hovered,setHovered]=useState<string|null>(null)
 const next=items.find(a=>a.status==='confirmed')
 const active=items.find(a=>a.id===hovered)??next??items[0]
 const name=(a:Appointment)=>practice.clients.find(c=>c.id===a.clientId)?.name??tr('Клиент','Client')
 const duration=[minutes>=60?`${Math.floor(minutes/60)} ${tr('ч','h')}`:'',minutes%60?`${minutes%60} ${tr('мин','min')}`:''].filter(Boolean).join(' ')
 const ticks=Array.from({length:4},(_,i)=>Math.round((start+(end-start)*i/3)/30)*30)
 const rows=Math.max(1,...lanes.map(l=>l.lanes))
 return <section className="dr-rhythm" aria-label={tr('Ритм дня','Day timeline')}>
  <header><h3>{tr('Ритм дня','Day timeline')}</h3><span>{minutes?duration:tr('Без встреч','No appointments')}</span></header>
  {items.length?<><div className="dr-plot" style={{height:rows*36}} onMouseLeave={()=>setHovered(null)}>
   <div className="dr-guides" aria-hidden="true">{ticks.map(t=><i key={t} style={{left:`${(t-start)/(end-start)*100}%`}}/>)}</div>
   {lanes.map(({appointment:a,lane})=><button key={a.id} className={`${a.id===next?.id?'is-next ':''}${a.status==='completed'?'is-completed':''}`} style={{left:`${(timeMinutes(a.time)-start)/(end-start)*100}%`,width:`${a.duration/(end-start)*100}%`,top:lane*36}} onMouseEnter={()=>setHovered(a.id)} onFocus={()=>setHovered(a.id)} onBlur={()=>setHovered(null)} onClick={()=>onOpen(a.id)} aria-label={`${a.time}–${clockTime(timeMinutes(a.time)+a.duration)} · ${name(a)} · ${a.title} · ${appointmentStatusLabel(a)}`} title={`${a.time} · ${name(a)} · ${a.duration} ${tr('мин','min')}`}><span/></button>)}
  </div><div className="dr-axis" aria-hidden="true">{ticks.map(t=><span key={t} style={{left:`${(t-start)/(end-start)*100}%`}}>{clockTime(t)}</span>)}</div>
  <p className="dr-detail" aria-live="polite">{active&&<><time>{active.time}–{clockTime(timeMinutes(active.time)+active.duration)}</time><span>{name(active)}</span></>}</p></>:<a className="dr-empty" href="#calendar">{tr('Открыть календарь','Open calendar')} →</a>}
 </section>
}
