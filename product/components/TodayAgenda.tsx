import {tr} from '../i18n'
import {appointmentStatusLabel,type Appointment,type Practice} from '../state/model'
import {Icon} from './Icon'

export function TodayAgenda({practice,items,onMeeting,onClient,onNew,onPrepare}:{practice:Practice;items:Appointment[];onMeeting:(id:string)=>void;onClient:(id:string)=>void;onNew:()=>void;onPrepare?:(id:string)=>void}){
 const ordered=[...items].sort((a,b)=>a.time.localeCompare(b.time))
 const first=ordered.find(a=>a.status==='confirmed')
 const client=practice.clients.find(c=>c.id===first?.clientId)
 const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('')
 return <div className="td-agenda">
  {first&&<section className="td-focus" aria-labelledby="today-focus-title">
   <div className="td-focus-top"><span className="td-focus-label"><span aria-hidden="true"/>{tr('Первая запланированная','First scheduled appointment')}</span></div>
   <div className="td-focus-person"><span className="td-person-avatar" aria-hidden="true">{initials(client?.name||tr('Клиент','Client'))}</span><div><div className="td-focus-heading"><h2 id="today-focus-title">{client?.name||tr('Клиент','Client')}</h2><span className="td-focus-time"><strong>{first.time}</strong><span>{first.duration} {tr('мин','min')}</span></span></div><p>{first.title}</p></div></div>
   {client?.request&&client.request!==first.title&&<p className="td-focus-request"><span>{tr('Запрос клиента','Client request')}</span>{client.request}</p>}
   <div className="td-focus-bottom"><span className="td-focus-note"><Icon name="note" size={18}/>{client?.notes?tr('Заметки к встрече готовы','Appointment notes are ready'):tr('Можно добавить заметки','You can add notes')}</span><div className="td-focus-actions">{client&&<button className="ep-button ep-button--primary" onClick={()=>onPrepare?onPrepare(first.id):onClient(client.id)}>{tr('Подготовиться','Prepare')}<Icon name="arrow" size={17}/></button>}<button className="ep-text-button" onClick={()=>onMeeting(first.id)}>{tr('Открыть встречу','Open appointment')}<Icon name="arrow" size={16}/></button></div></div>
  </section>}
  <section className="td-schedule" aria-labelledby="day-agenda-title">
   <header className="td-section-head"><h2 id="day-agenda-title">{tr('Расписание на сегодня',"Today's schedule")}</h2><a href="#calendar">{tr('Весь календарь','Full calendar')}<Icon name="arrow" size={16}/></a></header>
   {!ordered.length?<div className="td-empty"><Icon name="calendar" size={32}/><h3>{tr('Сегодня нет встреч','No appointments today')}</h3><button className="ep-button" onClick={onNew}>{tr('Запланировать встречу','Book an appointment')}</button></div>:<ol className="td-schedule-list">{ordered.map(a=>{
    const person=practice.clients.find(c=>c.id===a.clientId)
    return <li key={a.id} className={`td-schedule-item td-state-${a.status}${first?.id===a.id?' is-focus':''}`}><button className="td-meeting-row" onClick={()=>onMeeting(a.id)} aria-label={`${tr('Открыть встречу','Open appointment')}: ${a.time} · ${person?.name||tr('Клиент','Client')} · ${a.title} · ${appointmentStatusLabel(a)}`}>
     <span className="td-row-time"><strong>{a.time}</strong><small>{a.duration} {tr('мин','min')}</small></span><span className="td-row-person"><span className="td-person-avatar" aria-hidden="true">{initials(person?.name||tr('Клиент','Client'))}</span><span><strong>{person?.name||tr('Клиент','Client')}</strong><small>{a.title}</small></span></span><span className="td-row-status"><i aria-hidden="true"/>{appointmentStatusLabel(a)}</span><Icon name="arrow" size={16}/>
    </button></li>
   })}</ol>}
  </section>
 </div>
}
