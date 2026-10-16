import {useState,type FormEvent} from 'react'
import {type Appointment,type Client,formatDate,TODAY} from '../state/model'
import {Dialog} from './Dialog'
import {Icon} from './Icon'
import {LearningTip} from './Learning'
import {useFormExit} from './useFormExit'

type Props={appointment:Appointment,client:Client,onClose:()=>void,onNotes:()=>void,onReschedule:()=>void,onCancel:()=>void,onStatus:(status:'confirmed'|'completed')=>void,onOutcome?:(text:string)=>void,onNextMeeting?:()=>void,onPayment?:()=>void,startWithOutcome?:boolean}
export function MeetingDetails({appointment:a,client,onClose,onNotes,onReschedule,onCancel,onStatus,onOutcome,onNextMeeting,onPayment,startWithOutcome=false}:Props){
 const [editing,setEditing]=useState(()=>startWithOutcome&&!!onOutcome&&a.status!=='cancelled')
 const [statusError,setStatusError]=useState('')
 function restore(){try{onStatus('confirmed');setStatusError('')}catch(error){setStatusError((error as Error).message)}}
 const needsOutcome=a.status==='confirmed'&&a.date<TODAY
 const canRecordOutcome=a.status==='confirmed'&&a.date<=TODAY
 if(editing&&onOutcome)return <OutcomeForm appointment={a} client={client} onClose={()=>setEditing(false)} onSave={text=>{onOutcome(text);setEditing(false)}}/>
 return <Dialog title="Встреча" onClose={onClose}><div className="ep-dialog-body ep-meeting-detail">
  <h3>{a.title}</h3><p>{client.name}</p>
  <dl className="ex-detail"><div><dt>Когда</dt><dd>{formatDate(a.date)} · {a.time}</dd></div><div><dt>Длительность</dt><dd>{a.duration} мин</dd></div>{a.price!==undefined&&<div><dt>Стоимость</dt><dd>{new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(a.price)} ₽</dd></div>}<div><dt>Статус</dt><dd>{a.status==='completed'?'Завершена':a.status==='cancelled'?'Отменена':needsOutcome?'Нужно указать итог':'Запланирована'}</dd></div></dl>
  {statusError&&<div role="alert"><p className="ep-error">{statusError}</p>{onNextMeeting&&<button className="ep-button" onClick={onNextMeeting}>Записать на другое время</button>}</div>}
  {a.outcome&&<section className="ep-meeting-outcome"><h3>Итог встречи</h3><p className="ep-muted">Только вам</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{a.outcome}</p></section>}
  <div className="ex-actions">
   {needsOutcome&&onOutcome?<button className="ep-button ep-button--primary" onClick={()=>setEditing(true)}><Icon name="note"/>Записать итог и завершить</button>:a.status==='completed'&&onNextMeeting?<button className="ep-button ep-button--primary" onClick={onNextMeeting}>Записать на следующую встречу</button>:<button className="ep-button ep-button--primary" onClick={onNotes}><Icon name="note"/>Заметки клиента</button>}
   {needsOutcome&&<button className="ep-button" onClick={onNotes}>Заметки клиента</button>}
   {canRecordOutcome&&!needsOutcome&&onOutcome&&<button className="ep-button" onClick={()=>setEditing(true)}>Записать итог и завершить</button>}
   {a.status==='confirmed'&&!needsOutcome&&<button className="ep-button" onClick={onReschedule}>Перенести</button>}
   {a.status==='confirmed'&&<button className="ep-text-button" onClick={onCancel}>Отменить запись</button>}
   {a.status==='completed'&&onOutcome&&<button className="ep-button" onClick={()=>setEditing(true)}>{a.outcome?'Изменить итог':'Добавить итог'}</button>}
  </div>
  {!!a.price&&a.status!=='cancelled'&&onPayment&&<div className="ep-meeting-payment"><button className="ep-text-button" onClick={onPayment}><Icon name="wallet" size={18}/>Оплата встречи<Icon name="arrow" size={16}/></button></div>}
  {(a.status!=='confirmed'||needsOutcome||!canRecordOutcome)&&<details className="ep-meeting-extra"><summary>Другие действия</summary><div className="ex-actions">{a.status==='confirmed'?<>{needsOutcome&&<button className="ep-button" onClick={onReschedule}>Перенести</button>}{!canRecordOutcome&&(onOutcome?<button className="ep-button" onClick={()=>setEditing(true)}>Записать итог и завершить</button>:<button className="ep-button" onClick={()=>onStatus('completed')}>Завершить встречу</button>)}</>:<button className="ep-button" onClick={restore}>{a.status==='cancelled'?'Восстановить запись':'Вернуть в план'}</button>}</div></details>}
 </div></Dialog>
}

function OutcomeForm({appointment,client,onClose,onSave}:{appointment:Appointment,client:Client,onClose:()=>void,onSave:(text:string)=>void}){
 const exit=useFormExit(onClose),[text,setText]=useState(appointment.outcome||''),[error,setError]=useState('')
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();try{onSave(text)}catch(error){setError((error as Error).message)}}
 return <Dialog title="Итог консультации" onClose={exit.close}><form className="ep-form" onSubmit={submit} onInput={exit.changed}>
  <LearningTip topic="outcome" title="Что важно сохранить после встречи?">Запишите выводы и договорённости. После сохранения встреча станет завершённой.</LearningTip>
  <p>{client.name} · {formatDate(appointment.date)} · {appointment.time}</p>
  <label>Что обсудили и о чём договорились<textarea autoFocus rows={5} value={text} onChange={event=>setText(event.target.value)} placeholder="Главные выводы, рекомендации и следующий шаг"/></label>
  <p className="ep-muted">Итог останется в этой встрече. Он виден только вам.</p>
  {error&&<p className="ep-error" role="alert">{error}</p>}{exit.warning}
  <footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>Назад</button><button className="ep-button ep-button--primary">{appointment.status==='completed'?'Сохранить итог':text.trim()?'Сохранить итог и завершить':'Завершить без итога'}</button></footer>
 </form></Dialog>
}
