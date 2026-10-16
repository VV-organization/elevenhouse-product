import {useEffect,useRef,useState,type KeyboardEvent} from 'react'
import {TODAY,formatDate,type Practice} from '../state/model'
import {calendarDate,monthDays,shiftDay,shiftMonth} from '../state/calendar'
import {Icon} from './Icon'

type Props={revealAppointment?:string,onRevealed?:()=>void,practice:Practice,date:string,onDate:(date:string)=>void,onNew:()=>void,onOpenClient:(id:string)=>void,onReschedule:(id:string)=>void,onOpenAppointment:(id:string)=>void}
const week=['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
function readable(date:string,options:Intl.DateTimeFormatOptions){return calendarDate(date).toLocaleDateString('ru-RU',{...options,timeZone:'UTC'})}
export function PracticeCalendar({practice,date,onDate,onNew,onOpenClient,onOpenAppointment,revealAppointment,onRevealed}:Props){
 const [month,setMonth]=useState(date.slice(0,7)+'-01')
 const grid=useRef<HTMLDivElement>(null),agenda=useRef<HTMLElement>(null),monthPanel=useRef<HTMLElement>(null)
 useEffect(()=>setMonth(date.slice(0,7)+'-01'),[date])
 useEffect(()=>{if(!revealAppointment)return;const frame=requestAnimationFrame(()=>{const row=agenda.current?.querySelector<HTMLElement>(`[data-appointment="${revealAppointment}"]`);if(row){row.scrollIntoView({block:'center',behavior:'instant'});row.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});onRevealed?.()}});return()=>cancelAnimationFrame(frame)},[revealAppointment,date])
 const days=monthDays(month),items=practice.appointments.filter(a=>a.date===date).sort((a,b)=>a.time.localeCompare(b.time))
 const counts=new Map<string,number>()
 practice.appointments.filter(a=>a.status!=='cancelled').forEach(a=>counts.set(a.date,(counts.get(a.date)||0)+1))
 const planned=items.filter(a=>a.status==='confirmed').length
 function select(value:string,focus=false,reveal=false){onDate(value);setMonth(value.slice(0,7)+'-01');requestAnimationFrame(()=>{if(focus)grid.current?.querySelector<HTMLButtonElement>(`[data-date="${value}"]`)?.focus();else if(reveal&&window.matchMedia('(max-width:1050px)').matches){agenda.current?.focus({preventScroll:true});agenda.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})}})}
 function keyboard(event:KeyboardEvent<HTMLButtonElement>,day:string){let next='';const delta:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};if(event.key in delta)next=shiftDay(day,delta[event.key]);else if(event.key==='PageUp')next=shiftMonth(day,-1);else if(event.key==='PageDown')next=shiftMonth(day,1);else if(event.key==='Home')next=shiftDay(day,-((calendarDate(day).getUTCDay()+6)%7));else if(event.key==='End')next=shiftDay(day,6-((calendarDate(day).getUTCDay()+6)%7));if(next){event.preventDefault();select(next,true)}}
 return <div className="ep-cal-layout">
  <section ref={monthPanel} className="ep-cal-month" aria-label="Выбор дня">
   <div className="ep-cal-month-head"><h2 aria-live="polite">{readable(month,{month:'long',year:'numeric'}).replace(' г.','')}</h2><div className="ep-cal-arrows"><button className="ep-icon-button" aria-label="Предыдущий месяц" onClick={()=>setMonth(shiftMonth(month,-1))}><Icon name="back"/></button><button className="ep-icon-button ep-cal-forward" aria-label="Следующий месяц" onClick={()=>setMonth(shiftMonth(month,1))}><Icon name="back"/></button></div></div>
   <div className="ep-cal-week" aria-hidden="true">{week.map(day=><span key={day}>{day}</span>)}</div>
   <div className="ep-cal-days" ref={grid} role="group" aria-label="Дни месяца">
    {days.map(day=>{const count=counts.get(day)||0,inMonth=day.slice(0,7)===month.slice(0,7);return <button key={day} type="button" data-date={day} tabIndex={day===(days.includes(date)?date:month)?0:-1} aria-pressed={day===date} aria-current={day===TODAY?'date':undefined} aria-label={`${formatDate(day)}${day===TODAY?', сегодня':''}, ${count?`встреч: ${count}`:'нет встреч'}`} className={`ep-cal-day${inMonth?'':' is-adjacent'}${day===TODAY?' is-today':''}`} onClick={()=>select(day,false,true)} onKeyDown={event=>keyboard(event,day)}><span>{Number(day.slice(-2))}</span><span className="ep-cal-dots" aria-hidden="true">{Array.from({length:Math.min(3,count)},(_,i)=><i key={i}/>)}</span></button>})}
   </div>
   <div className="ep-cal-month-foot"><span><i/>Есть встречи</span><button className="ep-button ep-cal-today" onClick={()=>select(TODAY,false,true)}><Icon name="calendar" size={18}/>К сегодняшнему дню</button></div>
   <p className="ep-cal-zone">Время встреч · {practice.profile.timeZone}</p>
  </section>
  <section ref={agenda} tabIndex={-1} className="ep-cal-agenda" aria-label="Расписание выбранного дня">
   <button className="ep-text-button ep-cal-choose" onClick={()=>{monthPanel.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus({preventScroll:true})}}><Icon name="calendar" size={18}/>Выбрать другую дату</button>
   <div className="ep-cal-agenda-head"><div><p className="ep-eyebrow">{date===TODAY?'СЕГОДНЯ':readable(date,{weekday:'long'})}</p><h2 aria-live="polite">{readable(date,{day:'numeric',month:'long'})}{' '}<span className="ep-cal-year">{calendarDate(date).getUTCFullYear()}</span></h2></div><div className="ep-cal-arrows"><button className="ep-icon-button" aria-label="Предыдущий день" onClick={()=>select(shiftDay(date,-1))}><Icon name="back"/></button><button className="ep-icon-button ep-cal-forward" aria-label="Следующий день" onClick={()=>select(shiftDay(date,1))}><Icon name="back"/></button></div></div>
   <p className="ep-cal-summary" role="status">{items.length?`${planned?`Запланировано: ${planned}`:'Нет предстоящих встреч'} · Всего записей: ${items.length}`:'Встреч на этот день пока нет'}</p>
   {items.length?<div className="ep-cal-events">{items.map(a=>{const client=practice.clients.find(c=>c.id===a.clientId);return <article className={`ep-cal-event${a.status!=='confirmed'?' is-past':''}`} key={a.id} data-appointment={a.id}><div className="ep-cal-time"><strong>{a.time}</strong><span>{a.duration} мин</span></div><div className="ep-cal-event-body"><div className="ep-cal-event-heading"><h3>{client?.name||'Клиент'}</h3><span className={`ep-status ep-status--${a.status}`}>{a.status==='confirmed'?'Запланирована':a.status==='completed'?'Завершена':'Отменена'}</span></div><p>{a.title}</p><div className="ep-cal-event-actions"><button className="ep-text-button" onClick={()=>onOpenAppointment(a.id)}>Открыть встречу <Icon name="arrow" size={16}/></button><button className="ep-text-button" onClick={()=>onOpenClient(a.clientId)}>Карточка клиента <Icon name="arrow" size={16}/></button></div></div></article>})}</div>:<div className="ep-cal-empty"><Icon name="calendar" size={30}/><h3>Свободный день</h3><p>Запланируйте консультацию или оставьте время для себя.</p><button className="ep-button" onClick={onNew}><Icon name="plus" size={18}/>Записать на встречу</button></div>}
   {items.length>0&&<button className="ep-cal-add" onClick={onNew}><Icon name="plus" size={18}/>Добавить встречу на этот день</button>}
  </section>
 </div>
}
