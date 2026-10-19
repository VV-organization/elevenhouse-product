import {tr,localeTag} from '../i18n'
import {formatDate,appointmentStatusLabel,type Practice} from '../state/model'
import {calendarDate,shiftDay} from '../state/calendar'
import {availabilityForDate} from '../state/bookingRules'
import './core-parity.css'
import {appointmentLanes,timeMinutes,weeklyRange,WEEK_MINUTE_HEIGHT,MIN_MEETING_HEIGHT,scheduleSlots,clockTime} from './weekly-layout'
import {practiceDay} from '../state/guidedTour'
import {Icon} from './Icon'
import './calendar-reference.css'

type Props={practice:Practice;date:string;onDate:(value:string)=>void;onOpen:(id:string)=>void;onDay:(value:string)=>void;onNew:(date?:string,time?:string)=>void;onMove?:(id:string,date:string)=>void}
export function WeeklySchedule({practice,date,onDate,onOpen,onDay,onNew,onMove}:Props){
 const start=shiftDay(date,-((calendarDate(date).getUTCDay()+6)%7)),days=Array.from({length:7},(_,i)=>shiftDay(start,i))
 const range=weeklyRange(practice.appointments.filter(a=>a.date>=start&&a.date<=days[6])),scale=WEEK_MINUTE_HEIGHT
 const today=practiceDay(practice.profile.timeZone,practice.isExample)
 const period=(day:string)=>calendarDate(day).toLocaleDateString(localeTag(),{day:'numeric',month:'short',timeZone:'UTC'})
 return <section className="ep-week-schedule cv-reference-week" aria-label={tr('Расписание недели','Weekly schedule')}>
  <div className="cv-schedule-heading"><div><h2 aria-live="polite">{period(start)} — {period(days[6])} <span>{start.slice(0,4)}</span></h2><p>{practice.profile.timeZone}</p></div><div className="ep-cal-arrows"><button className="ep-icon-button" aria-label={tr('Предыдущая неделя','Previous week')} onClick={()=>onDate(shiftDay(date,-7))}><Icon name="back" size={18}/></button><button className="ep-button" onClick={()=>onDate(today)}>{tr('Текущая неделя','Current week')}</button><button className="ep-icon-button ep-cal-forward" aria-label={tr('Следующая неделя','Next week')} onClick={()=>onDate(shiftDay(date,7))}><Icon name="back" size={18}/></button></div></div>
  <div className="cv-schedule-scroll" tabIndex={0} role="region" aria-label={tr('Сетка недели, прокручивается по горизонтали','Week grid, scrolls horizontally')}>
   <div className="ep-week-columns cv-timed-week">
    <aside className="cv-time-axis" aria-hidden="true"><div className="cv-axis-head"><Icon name="calendar" size={18}/></div><div className="cv-axis-hours" style={{height:(range.end-range.start)*scale}}>{Array.from({length:(range.end-range.start)/60},(_,index)=><span key={index} style={{top:index*60*scale}}>{clockTime(range.start+index*60)}</span>)}</div></aside>
    {days.map(day=>{
     const appointments=practice.appointments.filter(a=>a.date===day).sort((a,b)=>a.time.localeCompare(b.time))
     const availability=practice.bookingRules?.enabled?availabilityForDate(practice.bookingRules,day):undefined
     const closed=availability?.closed
     const blocks=availability?(closed?[{start:range.start,end:range.end,label:tr('Выходной','Day off')}]:[{start:range.start,end:timeMinutes(availability.start),label:tr('Вне рабочих часов','Outside working hours')},{start:timeMinutes(availability.end),end:range.end,label:tr('Вне рабочих часов','Outside working hours')},...availability.blocked.map(b=>({start:timeMinutes(b.start),end:timeMinutes(b.end),label:b.reason||tr('Перерыв','Break')}))]):[]
     return <section key={day} data-day={day} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('application/elevenhouse-meeting');if(practice.appointments.some(a=>a.id===id&&a.status==='confirmed'))onMove?.(id,day)}} className={`${day===date?'is-selected ':''}${closed?'is-closed':''}`}>
      <button className="ep-week-day" aria-current={day===today?'date':undefined} aria-label={`${formatDate(day)}, ${tr('открыть день','open day')}`} onClick={()=>onDay(day)}><strong>{calendarDate(day).toLocaleDateString(localeTag(),{weekday:'short',timeZone:'UTC'})}</strong><span>{Number(day.slice(-2))}</span><small>{appointments.filter(a=>a.status!=='cancelled').length||'—'}</small></button>
      <div className="cv-week-timeline" style={{height:(range.end-range.start)*scale}}>
       {blocks.map((b,i)=>{const from=Math.max(range.start,b.start),to=Math.min(range.end,b.end);return to>from?<div key={i} className="cv-closed-time" style={{top:(from-range.start)*scale,height:(to-from)*scale}}><span>{b.label}</span></div>:null})}
       {scheduleSlots(practice,day,range).map(minute=><button key={minute} className="cv-open-slot" style={{top:(minute-range.start)*scale+6,height:60*scale-12}} aria-label={`${tr('Записать на встречу','Book an appointment')}: ${formatDate(day)}, ${clockTime(minute)}`} onClick={()=>onNew(day,clockTime(minute))}><Icon name="plus" size={16}/><time>{clockTime(minute)}</time></button>)}
       {appointmentLanes(appointments).map(({appointment:a,lane,lanes})=>{
        const name=practice.clients.find(c=>c.id===a.clientId)?.name||tr('Клиент','Client')
        return <button style={{top:(timeMinutes(a.time)-range.start)*scale+2,height:Math.max(MIN_MEETING_HEIGHT,a.duration*scale-4),left:`calc(${lane/lanes*100}% + 4px)`,width:`calc(${100/lanes}% - 8px)`}} draggable={a.status==='confirmed'} onDragStart={e=>e.dataTransfer.setData('application/elevenhouse-meeting',a.id)} className={`ep-week-meeting cv-status--${a.status}${a.duration<45?' cv-short-meeting':''}${a.status==='cancelled'?' is-cancelled':''}`} key={a.id} aria-label={`${a.time} · ${name} · ${a.title} · ${a.duration} ${tr('мин','min')} · ${appointmentStatusLabel(a)}`} title={`${name} · ${a.time}–${clockTime(timeMinutes(a.time)+a.duration)} · ${a.title} · ${appointmentStatusLabel(a)}`} onClick={()=>onOpen(a.id)}>
         <div className="cv-meeting-identity"><span className="cv-client-initials" aria-hidden="true">{name.split(/\s+/).map(part=>part[0]).slice(0,2).join('')}</span><strong>{name}</strong></div>
         <time>{a.time}–{clockTime(timeMinutes(a.time)+a.duration)}</time><span className="cv-meeting-service">{a.title}</span><small>{appointmentStatusLabel(a)}</small>
        </button>
       })}
       {!appointments.length&&<p className="cv-week-mobile-empty">{closed?tr('Выходной','Day off'):tr('Нет встреч','No appointments')}</p>}
      </div>
      <button className="cv-day-book" onClick={()=>onNew(day)}><Icon name="plus" size={16}/>{tr('Записать','Book')}</button>
     </section>
    })}
   </div>
  </div>
 </section>
}
