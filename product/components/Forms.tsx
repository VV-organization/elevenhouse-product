import {initialAppointmentDraft,readAppointmentDraft,type AppointmentDraft} from '../state/appointmentDraft'
export type {AppointmentDraft} from '../state/appointmentDraft'
import {LearningTip,useLearning} from './Learning'
import {ClientPicker} from './ClientPicker'
import {clientFullName,splitClientName} from '../state/names'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useModuleState } from '../modules/ModuleKit'
import { DEFAULT_SERVICES, type Service } from '../modules/ServicesFinance'
import { addClient, addAppointment, TODAY, formatDate, updateClientDetails, rescheduleAppointment, type Appointment, type Client, type Practice } from '../state/model'
import { Dialog } from './Dialog'
import {useFormExit} from './useFormExit'

type Props={practice:Practice,onSave:(value:Practice,id:string)=>void,onClose:()=>void}
export function ClientForm({practice,onSave,onClose,continueToAppointment=false,initialData}:Props&{continueToAppointment?:boolean,initialData?:Pick<Client,'birthDate'|'birthTime'|'birthPlace'|'unknownTime'|'notes'>}){
 const exit=useFormExit(onClose),learning=useLearning()
 const [unknown,setUnknown]=useState(initialData?.unknownTime??false),[error,setError]=useState('')
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);try{const next=addClient(practice,{name:clientFullName(String(data.get('firstName')||''),String(data.get('lastName')||'')),request:String(data.get('request')),birthDate:String(data.get('birthDate')||''),birthTime:String(data.get('birthTime')||''),birthPlace:String(data.get('birthPlace')||''),unknownTime:unknown,notes:initialData?.notes||''});onSave(next,next.clients.find(c=>!practice.clients.some(old=>old.id===c.id))!.id)}catch(e){setError((e as Error).message)}}
 return <Dialog title="Новый клиент" onClose={exit.close}><form className="ep-form" onInput={exit.changed} onChange={exit.changed} onSubmit={submit} onInvalidCapture={event=>{const details=(event.target as HTMLElement).closest('details');if(details)details.open=true}}><LearningTip topic="client" title={continueToAppointment?"Шаг 1 из 2 · Клиент":"Добавим клиента"}>{continueToAppointment?"Укажите имя и фамилию. Затем выберем время консультации.":"Имя и фамилия помогут различать клиентов. Остальное можно заполнить позже."}</LearningTip>{!learning.visible('client')&&<p className="ep-muted">{continueToAppointment?"Шаг 1 из 2. Добавьте клиента, затем выберите время консультации.":"Укажите имя и фамилию. Остальное можно заполнить позже."}</p>}<div className="ep-form-pair"><label>Имя <span aria-hidden="true">*</span><input name="firstName" autoFocus required autoComplete="given-name" placeholder="Марина"/></label><label>Фамилия <span aria-hidden="true">*</span><input name="lastName" required autoComplete="family-name" placeholder="Иванова"/></label></div><label>С чем обращается<textarea name="request" rows={2} placeholder="Запрос или тема первой встречи"/></label><details><summary>{initialData?'Данные рождения подставлены':'Добавить данные рождения'} <span>{initialData?'Можно изменить':'Необязательно'}</span></summary><div className="ep-form-fields"><label>Дата рождения<input name="birthDate" type="date" defaultValue={initialData?.birthDate} max={TODAY}/></label><div className="ep-form-pair"><label>Время рождения<input name="birthTime" type="time" defaultValue={initialData?.birthTime} disabled={unknown}/></label><label className="ep-checkbox"><input type="checkbox" checked={unknown} onChange={e=>setUnknown(e.target.checked)}/>Время неизвестно</label></div><label>Место рождения<input name="birthPlace" defaultValue={initialData?.birthPlace} placeholder="Город, страна"/></label></div></details>{error&&<p role="alert" className="ep-error">{error}</p>}{exit.warning}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>Отмена</button><button className="ep-button ep-button--primary">{continueToAppointment?"Добавить и продолжить":"Добавить клиента"}</button></footer></form></Dialog>
}
export function AppointmentForm({practice,onSave,onClose,clientId='',date=TODAY,appointment,onNewClient,initialDraft,initialDirty=true}:{clientId?:string,date?:string,appointment?:Appointment,onNewClient?:(draft:AppointmentDraft,dirty:boolean)=>void,initialDraft?:AppointmentDraft,initialDirty?:boolean}&Props){
 const exit=useFormExit(onClose),form=useRef<HTMLFormElement>(null)
 const [services]=useModuleState<Service[]>('services',practice.isExample,()=>practice.isExample?DEFAULT_SERVICES:[])
 const [initial]=useState(()=>initialAppointmentDraft({appointment,clientId,date,initialDraft}))
 const [error,setError]=useState(''),[selectedClient,setSelectedClient]=useState(initial.clientId)
 const [serviceId,setServiceId]=useState(initial.serviceId),[title,setTitle]=useState(initial.title)
 const [duration,setDuration]=useState(initial.duration),[price,setPrice]=useState(initial.price)
 useEffect(()=>{if(initialDraft&&initialDirty)exit.changed()},[])
 const available=services.filter(service=>service.status==='available')
 const retainedService=serviceId&&!available.some(service=>service.id===serviceId)
 useEffect(()=>{const frame=requestAnimationFrame(()=>{if(!appointment&&!initial.clientId)form.current?.querySelector<HTMLButtonElement>('.ep-client-picker-trigger')?.focus();else form.current?.querySelector<HTMLElement>(appointment?'input[name="date"]':'select[name="serviceId"],input[name="title"]')?.focus()});return()=>cancelAnimationFrame(frame)},[])
 function chooseService(id:string){
  setServiceId(id);exit.changed()
  const service=available.find(item=>item.id===id)
  if(service){setTitle(service.name);setDuration(String(service.duration));setPrice(String(service.price))}
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  if(!selectedClient){setError('Выберите клиента.');form.current?.querySelector<HTMLButtonElement>('.ep-client-picker-trigger')?.focus();return}
  const d=new FormData(event.currentTarget)
  try{
   const values={title,date:String(d.get('date')),time:String(d.get('time')),duration:Number(duration),serviceId:serviceId||undefined,price:price.trim()===''?undefined:Number(price)}
   const next=appointment?rescheduleAppointment(practice,appointment.id,values):addAppointment(practice,{...values,clientId:selectedClient})
   onSave(next,appointment?.id??next.appointments.find(a=>!practice.appointments.some(old=>old.id===a.id))!.id)
  }catch(e){setError((e as Error).message)}
 }
 const titleField=<label>Тема консультации<input name="title" value={title} onChange={event=>setTitle(event.target.value)} required/></label>
 const conditionFields=<div className="ep-form-pair"><label>Длительность, минут<input name="duration" type="number" min="1" max="1440" step="1" inputMode="numeric" value={duration} onChange={event=>setDuration(event.target.value)} required/></label><label>Стоимость, ₽ <span className="ep-muted">необязательно</span><input name="price" type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={event=>setPrice(event.target.value)} placeholder="Не указана"/></label></div>
 const serviceField=(available.length>0||serviceId)&&<label>Услуга<select name="serviceId" value={serviceId} onChange={event=>chooseService(event.target.value)}><option value="">Без готовой услуги</option>{retainedService&&<option value={serviceId}>{services.find(service=>service.id===serviceId)?.name||appointment?.title||title} · сохранённая услуга</option>}{available.map(service=><option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
 return <Dialog title={appointment?'Перенести встречу':'Новая встреча'} onClose={exit.close}><form ref={form} className="ep-form" onInput={exit.changed} onChange={exit.changed} onSubmit={submit} onInvalidCapture={event=>{const details=(event.target as HTMLElement).closest('details');if(details)details.open=true}}>
  <LearningTip topic="appointment" title={appointment?'Выберите новое время':!selectedClient?'Кого записываем?':serviceId?'Выберите дату и время':available.length?'Выберите услугу':'Выберите дату и время'}>{appointment?'Выберите новые дату и время. Клиент, стоимость и история встречи останутся на месте.':!selectedClient?'Выберите клиента или добавьте нового. Затем укажите время встречи.':serviceId?'Условия услуги уже подставлены. Сохраните запись — она появится в календаре.':available.length?'Услуга подставит длительность и стоимость. Можно заполнить их самостоятельно.':'Сохраните запись — она появится в календаре и у клиента.'}</LearningTip>
  {appointment&&<div><strong>{practice.clients.find(c=>c.id===appointment.clientId)?.name}</strong><p className="ep-muted">{appointment.title} · сейчас {formatDate(appointment.date)}, {appointment.time}</p></div>}
  {!appointment&&<ClientPicker clients={practice.clients} value={selectedClient} onChange={id=>{setSelectedClient(id);setError('');exit.changed()}} name="clientId" disabled={!!appointment} required/>}
  {!appointment&&onNewClient&&<button type="button" className="ep-text-button" onClick={()=>{if(form.current)onNewClient(readAppointmentDraft(new FormData(form.current)),exit.dirty)}}>Новый клиент</button>}
  {!appointment&&serviceField}
  {!appointment&&!serviceId&&titleField}
  <div className="ep-form-pair ep-meeting-date-time"><label>Дата<input name="date" type="date" defaultValue={initial.date} required/></label><label>Время<input name="time" type="time" defaultValue={initial.time} required/></label></div>
  {appointment?<details><summary>Изменить услугу, длительность или стоимость</summary><div className="ep-form-fields">{serviceField}{titleField}{conditionFields}</div></details>:serviceId?<><p className="ep-muted" aria-live="polite">{duration||'—'} мин · {price.trim()===''?'Стоимость не указана':`${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(price))} ₽`}</p><details><summary>Изменить условия встречи</summary><div className="ep-form-fields">{titleField}{conditionFields}</div></details></>:conditionFields}
  <p className="ep-muted">Часовой пояс: {practice.profile.timeZone}. {appointment?'Клиент и история встречи сохранятся.':'Запись появится в календаре и у клиента.'}</p>
  {error&&<p className="ep-error" role="alert">{error}</p>}{exit.warning}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>Отмена</button><button className="ep-button ep-button--primary">{appointment?'Перенести встречу':'Записать на встречу'}</button></footer>
 </form></Dialog>
}

export function ClientDetailsForm({practice,client,onSave,onClose}:Props&{client:Client}){
 const exit=useFormExit(onClose),[error,setError]=useState('')
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);try{onSave(updateClientDetails(practice,client.id,{name:clientFullName(String(data.get('firstName')||''),String(data.get('lastName')||'')),request:String(data.get('request')||'')}),client.id)}catch(e){setError((e as Error).message)}}
 return <Dialog title="Данные клиента" onClose={exit.close}><form className="ep-form" onInput={exit.changed} onChange={exit.changed} onSubmit={submit}><div className="ep-form-pair"><label>Имя <span aria-hidden="true">*</span><input name="firstName" defaultValue={splitClientName(client.name).firstName} autoComplete="given-name" required/></label><label>Фамилия <span aria-hidden="true">*</span><input name="lastName" defaultValue={splitClientName(client.name).lastName} autoComplete="family-name" required/></label></div><label>С чем обращается<textarea name="request" defaultValue={client.request} rows={4}/></label>{error&&<p className="ep-error" role="alert">{error}</p>}{exit.warning}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>Отмена</button><button className="ep-button ep-button--primary">Сохранить клиента</button></footer></form></Dialog>
}
