import {useState} from 'react'
import {Dialog} from './Dialog'
import {Select} from './Select'
import {tr,uiText} from '../i18n'
import {formatDate,type Appointment} from '../state/model'
import {useFormExit} from './useFormExit'
export function AppointmentCancellation({appointment:a,clientName,kind,onClose,onSave}:{appointment:Appointment;clientName:string;kind:'cancel'|'no-show';onClose:()=>void;onSave:(decision:NonNullable<Appointment['cancellation']>)=>void}){
 const [policy,setPolicy]=useState<'free'|'partial'|'hold'|'reschedule'>('free'),[percent,setPercent]=useState(50),[reason,setReason]=useState(''),[error,setError]=useState('');const exit=useFormExit(onClose)
 return <Dialog title={kind==='cancel'?tr('Отмена встречи','Cancel appointment'):tr('Клиент не пришёл','Client did not attend')} onClose={exit.close}><form className="ep-form" onInput={exit.changed} onSubmit={e=>{e.preventDefault();try{onSave({kind,policy,refundPercent:policy==='free'?100:policy==='partial'?percent:0,reason,recordedAt:new Date().toISOString()})}catch(e){setError((e as Error).message)}}}>
 <p><strong>{clientName}</strong><br/>{formatDate(a.date)} · {a.time} · {a.title}</p>
 <label>{tr('Условия отмены','Cancellation terms')}<Select value={policy} onChange={e=>{setPolicy(e.target.value as typeof policy);exit.changed()}}><option value="free">{tr('Без удержания оплаты','No payment withheld')}</option><option value="partial">{tr('Частичный возврат','Partial refund')}</option><option value="hold">{tr('Без возврата','No refund')}</option>{kind==='no-show'&&<option value="reschedule">{tr('Разовый перенос без штрафа','One reschedule without penalty')}</option>}</Select></label>
 {policy==='partial'&&<label>{tr('Доля возврата, %','Refund share, %')}<input type="number" min="1" max="99" step="1" required value={percent} onChange={e=>setPercent(Number(e.target.value))}/></label>}
 <label>{tr('Причина и договорённость','Reason and agreement')}<textarea rows={3} required value={reason} onChange={e=>setReason(e.target.value)} placeholder={tr('Кратко зафиксируйте договорённость с клиентом','Briefly record the agreement with the client')}/></label>
 <p className="ex-note">{policy==='reschedule'?tr('Встреча останется в истории как неявка. После сохранения можно выбрать новое время.','The appointment stays in history as a no-show. Choose a new time after saving.'):tr('Условия сохранятся у встречи. Если оплата получена, оформите возврат в разделе «Оплаты»: здесь деньги не списываются и не возвращаются.','Terms will be saved with this appointment. If payment was received, process the refund in Payments; no money is charged or refunded here.')}</p>
 {error&&<p role="alert" className="ep-error">{uiText(error)}</p>}{exit.warning}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>{tr('Назад','Back')}</button><button className="ep-button ep-button--danger">{kind==='cancel'?tr('Отменить встречу','Cancel appointment'):tr('Зафиксировать неявку','Record no-show')}</button></footer>
 </form></Dialog>
}
