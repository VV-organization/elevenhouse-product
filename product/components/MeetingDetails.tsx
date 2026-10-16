import {tr,localeTag,uiText} from '../i18n'
import {appointmentStatusLabel} from '../state/model'
import './core-parity.css'
import {useState,type FormEvent} from 'react'
import {type Appointment,type Client,formatDate,TODAY} from '../state/model'
import {Dialog} from './Dialog'
import {MeetingWorkspace,type MeetingWorkspaceProps} from './MeetingWorkspace'
import {Icon} from './Icon'
import {LearningTip} from './Learning'
import {useFormExit} from './useFormExit'

type Props={appointment:Appointment,client:Client,onClose:()=>void,onNotes:()=>void,onReschedule:()=>void,onCancel:()=>void,onStatus:(status:'confirmed'|'completed')=>void,onOutcome?:(text:string)=>void,onNextMeeting?:()=>void,onPayment?:()=>void,startWithOutcome?:boolean,onMeetingUrl?:(url:string)=>void,onNoShow?:()=>void,onChart?:()=>void;workspace?:Pick<MeetingWorkspaceProps,'session'|'adapter'|'video'>}
export function MeetingDetails({appointment:a,client,onClose,onNotes,onReschedule,onCancel,onStatus,onOutcome,onNextMeeting,onPayment,startWithOutcome=false,onMeetingUrl,onNoShow,onChart,workspace}:Props){
 const [editing,setEditing]=useState(()=>startWithOutcome&&!!onOutcome&&a.status!=='cancelled')
 const [statusError,setStatusError]=useState('')
 const [roomOpen,setRoomOpen]=useState(false)
 const [url,setUrl]=useState(a.meetingUrl||''),[urlEdit,setUrlEdit]=useState(false),[urlSaved,setUrlSaved]=useState(false)
 function restore(){try{onStatus('confirmed');setStatusError('')}catch(error){setStatusError((error as Error).message)}}
 const needsOutcome=a.status==='confirmed'&&a.date<TODAY
 const canRecordOutcome=a.status==='confirmed'&&a.date<=TODAY
 if(roomOpen)return <MeetingWorkspace key={a.id} appointment={a} client={client} onClose={()=>setRoomOpen(false)} onNotes={onNotes} onChart={onChart} onOutcome={onOutcome} {...workspace}/>
 if(editing&&onOutcome)return <OutcomeForm appointment={a} client={client} onClose={()=>setEditing(false)} onSave={text=>{onOutcome(text);setEditing(false)}}/>
 return <Dialog title={tr("Встреча","Appointment")} onClose={onClose}><div className="ep-dialog-body ep-meeting-detail">
  <h3>{a.title}</h3><p>{client.name}</p>
  <dl className="ex-detail"><div><dt>{tr("Когда","When")}</dt><dd>{formatDate(a.date)} · {a.time}</dd></div><div><dt>{tr("Длительность","Duration")}</dt><dd>{a.duration} {tr(" мин"," min")}</dd></div>{a.price!==undefined&&<div><dt>{tr("Стоимость","Price")}</dt><dd>{new Intl.NumberFormat(localeTag(),{maximumFractionDigits:2}).format(a.price)} ₽</dd></div>}<div><dt>{tr("Статус","Status")}</dt><dd>{a.status==='completed'?tr("Завершена","Completed"):a.status==='cancelled'?appointmentStatusLabel(a):needsOutcome?tr("Нужно указать итог","Outcome needed"):tr("Запланирована","Scheduled")}</dd></div></dl>
  {statusError&&<div role="alert"><p className="ep-error">{uiText(statusError)}</p>{onNextMeeting&&<button className="ep-button" onClick={onNextMeeting}>{tr("Записать на другое время","Choose another time")}</button>}</div>}
  {a.status!=='cancelled'&&<section className="ep-meeting-room">
   <h3>{tr('Подготовка и проведение','Prepare and meet')}</h3>
   <div className="ex-actions">
    <button className="ep-button" onClick={()=>setRoomOpen(true)}>{tr('Открыть пространство консультации','Open consultation workspace')}</button>
    {onChart&&<button className="ep-button" onClick={onChart}>{tr('Карта клиента','Client chart')}</button>}
    {a.meetingUrl&&!urlEdit&&<a className="ep-button ep-button--primary" href={a.meetingUrl} target="_blank" rel="noreferrer">{tr('Открыть видеовстречу','Open video meeting')}</a>}
   </div>
   {onMeetingUrl&&<>
    {!a.meetingUrl&&!urlEdit&&<p className="ep-muted">{tr('Для онлайн-консультации добавьте ссылку на видеовстречу.','For an online consultation, add your video meeting link.')}</p>}
    <button className="ep-text-button" onClick={()=>{setUrl(a.meetingUrl||'');setUrlEdit(!urlEdit);setUrlSaved(false)}}>{urlEdit?tr('Закрыть редактирование','Close editor'):a.meetingUrl?tr('Изменить ссылку','Edit meeting link'):tr('Добавить ссылку на видеовстречу','Add video meeting link')}</button>
    {urlEdit&&<form onSubmit={e=>{e.preventDefault();try{onMeetingUrl(url);setUrlEdit(false);setUrlSaved(true);setStatusError('')}catch(e){setStatusError((e as Error).message)}}}><label>{tr('Ссылка https://…','Meeting link https://…')}<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label><button className="ep-button">{tr('Сохранить ссылку','Save link')}</button></form>}
    {urlSaved&&<p role="status">{tr('Ссылка сохранена у встречи.','Meeting link saved.')}</p>}
   </>}
  </section>}
  {a.status==='cancelled'&&a.cancellation&&<section className="ep-meeting-outcome"><h3>{tr('Условия отмены','Cancellation terms')}</h3><p>{a.cancellation.policy==='reschedule'?tr('Разовый перенос без штрафа','One reschedule without penalty'):a.cancellation.refundPercent===0?tr('Без возврата','No refund'):`${tr('Возврат','Refund')}: ${a.cancellation.refundPercent}%`}</p><p>{a.cancellation.reason}</p><p className="ep-muted">{tr('Записанная договорённость. Статус возврата проверяйте в оплатах.','Recorded agreement. Check Payments for the refund status.')}</p></section>}
  {a.outcome&&<section className="ep-meeting-outcome"><h3>{tr("Итог встречи","Appointment outcome")}</h3><p className="ep-muted">{tr("Только вам","Only visible to you")}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{a.outcome}</p></section>}
  <div className="ex-actions">
   {needsOutcome&&onOutcome?<button className="ep-button ep-button--primary" onClick={()=>setEditing(true)}><Icon name="note"/>{tr("Записать итог и завершить","Record outcome and finish")}</button>:a.status==='completed'&&onNextMeeting?<button className="ep-button ep-button--primary" onClick={onNextMeeting}>{tr("Записать на следующую встречу","Book the next appointment")}</button>:<button className="ep-button ep-button--primary" onClick={onNotes}><Icon name="note"/>{tr("Заметки клиента","Client notes")}</button>}
   {needsOutcome&&<button className="ep-button" onClick={onNotes}>{tr("Заметки клиента","Client notes")}</button>}
   {canRecordOutcome&&!needsOutcome&&onOutcome&&<button className="ep-button" onClick={()=>setEditing(true)}>{tr("Записать итог и завершить","Record outcome and finish")}</button>}
   {a.status==='confirmed'&&!needsOutcome&&<button className="ep-button" onClick={onReschedule}>{tr("Перенести","Reschedule")}</button>}
   {a.status==='confirmed'&&a.date<=TODAY&&onNoShow&&<button className="ep-text-button" onClick={onNoShow}>{tr('Клиент не пришёл','Client did not attend')}</button>}
   {a.status==='confirmed'&&<button className="ep-text-button" onClick={onCancel}>{tr("Отменить запись","Cancel appointment")}</button>}
   {a.status==='completed'&&onOutcome&&<button className="ep-button" onClick={()=>setEditing(true)}>{a.outcome?tr("Изменить итог","Edit outcome"):tr("Добавить итог","Add outcome")}</button>}
  </div>

  {!!a.price&&onPayment&&<div className="ep-meeting-payment"><button className="ep-text-button" onClick={onPayment}><Icon name="wallet" size={18}/>{a.status==='cancelled'?tr("Оплата и возврат","Payment and refund"):tr("Оплата встречи","Appointment payment")}<Icon name="arrow" size={16}/></button></div>}
  {(a.status!=='confirmed'||needsOutcome||!canRecordOutcome)&&<details className="ep-meeting-extra"><summary>{tr("Другие действия","More actions")}</summary><div className="ex-actions">{a.status==='confirmed'?<>{needsOutcome&&<button className="ep-button" onClick={onReschedule}>{tr("Перенести","Reschedule")}</button>}{!canRecordOutcome&&(onOutcome?<button className="ep-button" onClick={()=>setEditing(true)}>{tr("Записать итог и завершить","Record outcome and finish")}</button>:<button className="ep-button" onClick={()=>onStatus('completed')}>{tr("Завершить встречу","Complete appointment")}</button>)}</>:<button className="ep-button" onClick={restore}>{a.status==='cancelled'?tr("Восстановить запись","Restore appointment"):tr("Вернуть в план","Mark as scheduled")}</button>}</div></details>}
 </div></Dialog>
}

function OutcomeForm({appointment,client,onClose,onSave}:{appointment:Appointment,client:Client,onClose:()=>void,onSave:(text:string)=>void}){
 const exit=useFormExit(onClose),[text,setText]=useState(appointment.outcome||''),[error,setError]=useState('')
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();try{onSave(text)}catch(error){setError((error as Error).message)}}
 return <Dialog title={tr("Итог консультации","Consultation outcome")} onClose={exit.close}><form className="ep-form" onSubmit={submit} onInput={exit.changed}>
  <LearningTip topic="outcome" title={tr("Что важно сохранить после встречи?","What would you like to keep from this appointment?")}>{tr("Запишите выводы и договорённости. После сохранения встреча станет завершённой.","Write down the conclusions and agreements. Saving marks the appointment as completed.")}</LearningTip>
  <p>{client.name} · {formatDate(appointment.date)} · {appointment.time}</p>
  <label>{tr("Что обсудили и о чём договорились","What you discussed and agreed")}<textarea autoFocus rows={5} value={text} onChange={event=>setText(event.target.value)} placeholder={tr("Главные выводы, рекомендации и следующий шаг","Key conclusions, recommendations and the next step")}/></label>
  <p className="ep-muted">{tr("Итог останется в этой встрече. Он виден только вам.","This outcome stays with this appointment. Only you can see it.")}</p>
  {error&&<p className="ep-error" role="alert">{uiText(error)}</p>}{exit.warning}
  <footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>{tr("Назад","Back")}</button><button className="ep-button ep-button--primary">{appointment.status==='completed'?tr("Сохранить итог","Save outcome"):text.trim()?tr("Сохранить итог и завершить","Save outcome and finish"):tr("Завершить без итога","Finish without an outcome")}</button></footer>
 </form></Dialog>
}
