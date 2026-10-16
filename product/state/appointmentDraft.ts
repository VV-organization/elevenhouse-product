import {tr} from '../i18n'
import type {Appointment} from './model'
export type AppointmentDraft={clientId:string;serviceId:string;title:string;date:string;time:string;duration:string;price:string}
/** Keep raw inputs, including blanks, while the client is created in another form. */
export function readAppointmentDraft(data:FormData):AppointmentDraft{
 const field=(name:string)=>String(data.get(name)??'')
 return {clientId:field('clientId'),serviceId:field('serviceId'),title:field('title'),date:field('date'),time:field('time'),duration:field('duration'),price:field('price')}
}
export function initialAppointmentDraft({appointment,clientId='',date,initialDraft}:{appointment?:Appointment;clientId?:string;date:string;initialDraft?:AppointmentDraft}):AppointmentDraft{
 if(appointment)return {clientId:appointment.clientId,serviceId:appointment.serviceId??'',title:appointment.title,date:appointment.date,time:appointment.time,duration:String(appointment.duration),price:appointment.price===undefined?'':String(appointment.price)}
 return initialDraft?{...initialDraft,clientId:clientId||initialDraft.clientId}:{clientId,serviceId:'',title:tr('Консультация','Consultation'),date,time:'',duration:'60',price:''}
}
