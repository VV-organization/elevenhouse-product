import {tr} from '../i18n'
import {appointmentStatusLabel,type Appointment,type Practice} from '../state/model'
import {Icon} from './Icon'

export function TodayAgenda({practice,items,onMeeting,onClient,onNew,onPrepare}:{practice:Practice;items:Appointment[];onMeeting:(id:string)=>void;onClient:(id:string)=>void;onNew:()=>void;onPrepare?:(id:string)=>void}){
 const first=items.find(a=>a.status==='confirmed')
 return <section className="ep-day-agenda" aria-labelledby="day-agenda-title">
  <div className="ep-section-heading"><h2 id="day-agenda-title">{tr('План на сегодня',"Today's schedule")}</h2><a href="#calendar">{tr('Весь календарь','Full calendar')} <Icon name="arrow" size={16}/></a></div>
  {!items.length?<div className="ep-day-empty"><h3>{tr('Сегодня нет встреч','No appointments today')}</h3><button className="ep-button" onClick={onNew}>{tr('Запланировать встречу','Book an appointment')}</button></div>:<ol className="ep-day-timeline">{items.map(a=>{
   const client=practice.clients.find(c=>c.id===a.clientId),featured=a.id===first?.id
   return <li key={a.id} className={featured?'is-featured':''}>
    <div className="ep-day-time"><strong>{a.time}</strong><span>{a.duration} {tr('мин','min')}</span></div>
    <article className="ep-day-appointment">
     <div className="ep-day-identity">{featured&&<span className="ep-day-label">{tr('Первая запланированная','First scheduled appointment')}</span>}<h3>{client?.name||tr('Клиент','Client')}</h3><span className={`ep-status ep-status--${a.status}`}>{a.status==='confirmed'?tr('Запланирована','Scheduled'):a.status==='completed'?tr('Завершена','Completed'):appointmentStatusLabel(a)}</span></div>
     <p>{a.title}</p>
     {featured&&client?.request&&client.request!==a.title&&<p className="ep-day-request"><span>{tr('Запрос: ','Request: ')}</span>{client.request}</p>}
     {featured&&<span className="ep-day-note"><Icon name="note" size={16}/>{client?.notes?tr('Заметки к встрече готовы','Appointment notes are ready'):tr('Можно добавить заметки','You can add notes')}</span>}
     <div className="ep-day-actions">{featured&&client&&<button className="ep-button ep-button--primary" onClick={()=>onPrepare?onPrepare(a.id):onClient(client.id)}>{tr('Подготовиться','Prepare')} <Icon name="arrow" size={16}/></button>}<button className="ep-text-button" onClick={()=>onMeeting(a.id)}>{tr('Открыть встречу','Open appointment')} <Icon name="arrow" size={16}/></button></div>
    </article>
   </li>
  })}</ol>}
 </section>
}
