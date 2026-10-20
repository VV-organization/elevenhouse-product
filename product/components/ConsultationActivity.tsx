import {tr,localeTag} from '../i18n'
import type {Practice} from '../state/model'

export function consultationDays(appointments:Practice['appointments'],today:string){
 const month=today.slice(0,7),days=Number(today.slice(8,10))
 const counts=new Map<string,number>()
 for(const appointment of appointments){
  if(appointment.status==='completed'&&appointment.date.startsWith(month)&&appointment.date<=today)
   counts.set(appointment.date,(counts.get(appointment.date)||0)+1)
 }
 return Array.from({length:days},(_,i)=>{
  const date=`${month}-${String(i+1).padStart(2,'0')}`
  return {date,count:counts.get(date)||0}
 })
}

/** A compact month-to-date distribution, inside the existing analytics link. */
export function ConsultationActivity({appointments,today}:{appointments:Practice['appointments'];today:string}){
 const days=consultationDays(appointments,today),maximum=Math.max(0,...days.map(d=>d.count))
 if(!maximum)return <span className="pd-consultation-empty">{tr('В этом месяце ещё нет завершённых встреч','No completed appointments this month yet')}</span>
 const format=(date:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'))
 return <span className="pd-consultation-activity">
  <svg viewBox={`0 0 ${days.length*10} 40`} preserveAspectRatio="none" role="img" aria-label={`${tr('Проведённые встречи по дням','Completed appointments by day')}: ${days.map(d=>`${format(d.date)}: ${d.count}`).join('; ')}`}>
   {days.map((day,i)=><g key={day.date}><title>{format(day.date)} · {day.count}</title><path d={`M${i*10+1} 39H${i*10+8}`} className="pd-activity-baseline"/>{day.count>0&&<rect x={i*10+1} y={38-day.count/maximum*36} width="7" height={day.count/maximum*36} rx="1.5" className={day.count===maximum?'is-peak':undefined}/>}</g>)}
  </svg>
  <span className="pd-consultation-axis" aria-hidden="true"><small>{format(days[0].date)}</small><small>{format(today)}</small></span>
 </span>
}
