import {useState,type ReactNode} from 'react'
import {tr,localeTag} from '../i18n'
import {formatDate,appointmentStatusLabel,type Client,type Practice} from '../state/model'
import {meetingGroups} from '../state/ordering'
import {clientStages} from './ClientCRM'
import {ClientOverview} from './ClientOverview'
import {ClientOrders} from './ClientOrders'
import {Icon} from './Icon'
import './client-profile-dashboard.css'

type Props={practice:Practice;client:Client;today:string;onMethod:(method:string,savedKey?:string)=>void;onEdit:()=>void;onBirth:()=>void;onNotes:()=>void;onPayments:()=>void;onMessage:()=>void;onNew:()=>void;onMeeting:(id:string)=>void;onOrder:(id:string)=>void}
export function ClientProfileDashboard({practice,client,today,onMethod,onEdit,onBirth,onNotes,onPayments,onMessage,onNew,onMeeting,onOrder}:Props){
 const appointments=practice.appointments.filter(a=>a.clientId===client.id)
 const {upcoming,history}=meetingGroups(appointments,today)
 const [meetingView,setMeetingView]=useState(upcoming.length?'upcoming':'history'),[limit,setLimit]=useState(4),[requestExpanded,setRequestExpanded]=useState(false)
 const meetings=meetingView==='upcoming'?upcoming:history
 const outcomes=history.filter(a=>a.outcome?.trim())
 const shortDate=(date:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',year:date.slice(0,4)!==today.slice(0,4)?'numeric':undefined,timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'))
 return <ClientOverview practice={practice} client={client} onMethod={onMethod} render={({metrics,calculations})=><div className="cp-dashboard">
  <ClientProfileIdentity practice={practice} client={client} metrics={metrics} onEdit={onEdit} onBirth={onBirth} onMessage={onMessage} onPayments={onPayments}/>
  <div className="cp-main-column"><div className="cp-calculations">{calculations}</div>
   <section className="cp-panel cp-meetings" aria-label={tr('Встречи клиента','Client appointments')}>
    <div className="cp-panel-heading"><h2><span className="cp-symbol cp-symbol--sage"><Icon name="calendar" size={20}/></span>{tr('Встречи','Appointments')}</h2><button className="ep-text-button" onClick={onNew}><Icon name="plus" size={16}/>{tr('Записать','Book')}</button></div>
    <div className="cp-meeting-tabs" role="group" aria-label={tr('Период встреч клиента','Client appointment period')}><button aria-pressed={meetingView==='upcoming'} onClick={()=>{setMeetingView('upcoming');setLimit(4)}}>{tr('Запланированы','Upcoming')} <span>{upcoming.length}</span></button><button aria-pressed={meetingView==='history'} onClick={()=>{setMeetingView('history');setLimit(4)}}>{tr('История','History')} <span>{history.length}</span></button></div>
    {meetings.length?<div className="cp-meeting-list"><div className="cp-meeting-columns" aria-hidden="true"><span>{tr('Дата','Date')}</span><span>{tr('Встреча','Appointment')}</span></div>{meetings.slice(0,limit).map(a=><button className="cp-meeting-row" key={a.id} onClick={()=>onMeeting(a.id)} aria-label={`${tr('Открыть встречу','Open appointment')}: ${a.title}, ${formatDate(a.date)}, ${a.time}`}><span className="cp-meeting-date"><strong>{shortDate(a.date)}</strong><small>{a.time}</small></span><span className="cp-meeting-title"><strong>{a.title}</strong><small><span className={`cp-status cp-status--${a.status}`}>{appointmentStatusLabel(a)}</span> · {a.duration} {tr('мин','min')}</small></span><Icon name="arrow" size={16}/></button>)}</div>:<p className="cp-empty">{meetingView==='upcoming'?tr('Нет запланированных встреч','No upcoming appointments'):tr('История встреч пока пуста','No appointment history yet')}</p>}
    {meetings.length>limit&&<button className="ep-text-button cp-more" onClick={()=>setLimit(n=>n+6)}>{tr('Показать ещё','Show more')} · {meetings.length-limit}</button>}
   </section>
  </div>
  <div className="cp-side-column">
   <section className="cp-panel cp-request"><div className="cp-panel-heading"><h2><span className="cp-symbol"><Icon name="message" size={20}/></span>{tr('Запрос клиента','Client request')}</h2><button className="ep-text-button" onClick={onEdit}>{client.request?tr('Изменить','Edit'):tr('Добавить','Add')}</button></div><div className="cp-copy"><p className={!requestExpanded&&client.request.length>220?'cp-excerpt':''}>{client.request||tr('Запрос пока не указан','No request added yet')}</p></div>{client.request.length>220&&<button className="ep-text-button" aria-expanded={requestExpanded} onClick={()=>setRequestExpanded(!requestExpanded)}>{requestExpanded?tr('Свернуть','Show less'):tr('Показать целиком','Show full request')}</button>}</section>
   <section className="cp-panel cp-private-note"><div className="cp-panel-heading"><h2><span className="cp-symbol cp-symbol--gold"><Icon name="note" size={20}/></span>{tr('Личная заметка','Private note')}</h2><button className="ep-icon-button" aria-label={tr('Открыть заметки клиента','Open client notes')} onClick={onNotes}><Icon name="arrow" size={18}/></button></div><div className="cp-copy"><p className="cp-excerpt">{client.notes||tr('Что важно помнить о клиенте','What to remember about this client')}</p></div><div className="cp-note-footer"><small>{tr('Видна только вам','Only visible to you')}</small><button className="ep-text-button" onClick={onNotes}>{client.notes?tr('Редактировать','Edit'):tr('Добавить заметку','Add note')}</button></div></section>
   <section className="cp-panel cp-outcomes"><div className="cp-panel-heading"><h2><span className="cp-symbol cp-symbol--sage"><Icon name="note" size={20}/></span>{tr('Итоги консультаций','Consultation outcomes')}</h2><button className="ep-icon-button" aria-label={tr('Все заметки и итоги','All notes and outcomes')} onClick={onNotes}><Icon name="arrow" size={18}/></button></div>{outcomes.length?<div>{outcomes.slice(0,2).map(a=><button className="cp-outcome" key={a.id} onClick={()=>onMeeting(a.id)}><time>{shortDate(a.date)}</time><strong>{a.title}</strong><span>{a.outcome}</span><small>{tr('Открыть встречу','Open appointment')} →</small></button>)}{outcomes.length>2&&<button className="ep-text-button cp-more" onClick={onNotes}>{tr('Все итоги','All outcomes')} · {outcomes.length}</button>}</div>:<p className="cp-empty">{tr('Пока нет сохранённых итогов','No saved outcomes yet')}</p>}</section>
   <div className="cp-orders"><ClientOrders practice={practice} clientId={client.id} onOpen={onOrder}/></div>
  </div>
 </div>}/>
}

 type IdentityProps=Pick<Props,'practice'|'client'|'onEdit'|'onBirth'|'onMessage'|'onPayments'>
function ClientProfileIdentity({practice,client,metrics,onEdit,onBirth,onMessage,onPayments}:IdentityProps&{metrics:ReactNode}){
 const stage=[...clientStages(),...(practice.clientStages||[]).map(s=>[s.id,s.label])].find(([id])=>id===client.stage)?.[1]
 return <section className="cp-person cp-panel" aria-label={tr('Данные клиента','Client details')}>
   <div className="cp-identity"><span className="cp-avatar" aria-hidden="true">{client.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</span><h2>{client.name}</h2><button className="ep-icon-button" aria-label={tr('Изменить данные и запрос','Edit details and request')} onClick={onEdit}><Icon name="settings" size={18}/></button></div>
   <div className="cp-subheading"><h3>{tr('Данные рождения','Birth details')}</h3><button className="ep-icon-button" aria-label={tr('Изменить данные рождения','Edit birth details')} onClick={onBirth}><Icon name="settings" size={16}/></button></div>
   <dl className="cp-facts"><div><dt>{tr('Дата','Date')}</dt><dd>{client.birthDate?formatDate(client.birthDate):tr('Не указана','Not set')}</dd></div><div><dt>{tr('Время','Time')}</dt><dd>{client.unknownTime?tr('Неизвестно','Unknown'):client.birthTime||tr('Не указано','Not set')}</dd></div><div><dt>{tr('Место рождения','Birthplace')}</dt><dd>{client.birthPlace||tr('Не указано','Not set')}</dd></div><div><dt>{tr('Этап работы','Client stage')}</dt><dd><span className="cp-stage-value">{stage||tr('Не указан','Not set')}</span></dd></div></dl>
   <div className="cp-subheading"><h3>{tr('Контакты','Contacts')}</h3><button className="ep-text-button" aria-label={tr('Изменить контакты','Edit contacts')} onClick={onEdit}>{tr('Изменить','Edit')}</button></div>
   <dl className="cp-contacts">{client.phone&&<div><dt>{tr('Телефон','Phone')}</dt><dd><a href={`tel:${client.phone.replace(/[^+\d]/g,'')}`}>{client.phone}</a></dd></div>}{client.email&&<div><dt>Email</dt><dd><a href={`mailto:${client.email}`}>{client.email}</a></dd></div>}{client.telegram&&<div><dt>Telegram</dt><dd>{client.telegram}</dd></div>}</dl>
   {!client.phone&&!client.email&&!client.telegram&&<button className="cp-text-row" onClick={onEdit}>{tr('Добавить контакт','Add contact')}<Icon name="plus" size={16}/></button>}
   {!!client.tags?.length&&<div className="cp-tags"><h3>{tr('Метки','Tags')}</h3><p>{client.tags.join(' · ')}</p></div>}
   <div className="cp-activity"><h3>{tr('Работа с клиентом','Client activity')}</h3>{metrics}</div>
   <div className="cp-person-actions"><button className="cp-text-row" onClick={onMessage}><Icon name="message" size={18}/><span>{tr('Переписка','Messages')}</span><Icon name="arrow" size={16}/></button><button className="cp-text-row" onClick={onPayments}><Icon name="wallet" size={18}/><span>{tr('Оплаты клиента','Client payments')}</span><Icon name="arrow" size={16}/></button></div>
  </section>
}
export function ClientProfileWork({children,view,...props}:IdentityProps&{children:ReactNode;view:'chart'|'notes'}){
 return <ClientOverview practice={props.practice} client={props.client} onMethod={()=>{}} render={({metrics})=><div className={`cp-dashboard cp-work cp-work--${view}`}><div className="cp-work-body">{children}</div><ClientProfileIdentity {...props} metrics={metrics}/></div>}/>
}
