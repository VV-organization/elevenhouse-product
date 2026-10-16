import {zonedTimestamp} from './portal-slots'
import type {Practice} from '../state/model'
import type {Service} from './ServicesFinance'
import type {PortalOrder} from './portal-order-model'

export type Booking={id:string,orderId?:string,appointmentId?:string,serviceId:string,title:string,price:number,duration:number,date:string,time:string,status:'pending'|'confirmed'|'completed'|'cancelled'}
export type ClientProfile={name:string,birthDate:string,birthTime:string,birthPlace:string,unknownTime:boolean}

/** Calendar records win over browser caches; order and legacy records are retained. */
export function reconcilePortalBookings(stored:Booking[],appointments:Practice['appointments'],clientId:string|undefined,orders:PortalOrder[],services:Service[]=[]):Booking[]{
 if(!clientId)return []
 const ownOrders=orders.filter(o=>o.clientId===clientId)
 const candidates=[...stored]
 for(const order of ownOrders){const a=order.appointment;if(a&&!candidates.some(b=>b.orderId===order.id))candidates.push({id:a.id,orderId:order.id,serviceId:order.serviceId,title:order.title,price:order.total,date:a.date,time:a.time,duration:a.duration,status:'pending'})}
 const result:Booking[]=[],seen=new Set<string>()
 // Retain the order snapshot link when an old calendar cache duplicates its booking.
 candidates.sort((a,b)=>Number(Boolean(b.orderId))-Number(Boolean(a.orderId)))
 for(const b of candidates){
  const order=ownOrders.find(o=>o.id===b.orderId)
  if(b.orderId&&orders.some(o=>o.id===b.orderId)&&!order)continue
  const appointmentId:string|undefined=order?.appointment?.id??b.appointmentId??(b.id==='original'&&clientId==='marina'?'session-marina':undefined)
  const source:Practice['appointments'][number]|undefined=appointments.find(a=>a.id===appointmentId)
  if(source&&source.clientId!==clientId)continue
  const key=appointmentId?`appointment:${appointmentId}`:`booking:${b.id}`
  if(seen.has(key))continue
  seen.add(key)
  const status:Booking['status']=source?.status??(order?.status==='cancelled'||order?.status==='rejected'?'cancelled':order?.status==='accepted'||order?.status==='cancellation-requested'?'confirmed':b.status)
  result.push({...b,...(appointmentId?{appointmentId}:{}),status,...(source?{serviceId:source.serviceId??b.serviceId,title:source.title,date:source.date,time:source.time,duration:source.duration,price:source.price??b.price}:{})})
 }
 for(const a of appointments.filter(a=>a.clientId===clientId)){
  if(seen.has(`appointment:${a.id}`))continue
  result.push({id:`portal-${a.id}`,appointmentId:a.id,serviceId:a.serviceId??'',title:a.title,price:a.price??services.find(s=>s.id===a.serviceId)?.price??0,duration:a.duration,date:a.date,time:a.time,status:a.status})
 }
 return result
}
export function bookingSchedule(appointments:Practice['appointments'],bookings:Booking[]){
 const ids=new Set(appointments.map(a=>a.id))
 return [...appointments,...bookings.filter(b=>!ids.has(b.appointmentId||(b.id==='original'?'session-marina':b.id)))]
}
export function updatePortalProfile(practice:Practice,clientId:string,profile:ClientProfile,updatedAt=new Date().toISOString()):Practice{
 return {...practice,clients:practice.clients.map(c=>c.id===clientId?{...c,name:profile.name.trim(),birthDate:profile.birthDate,birthTime:profile.unknownTime?'':profile.birthTime,birthPlace:profile.birthPlace.trim(),unknownTime:profile.unknownTime,updatedAt}:c)}
}

/** Uses the current calendar record, never stale date/status from a cached card. */
export function portalCancellation(practice:Practice,booking:Booking,clientId:string|undefined,now=new Date()):{allowed:boolean;reason:'finished'|'past'|'notice'|'unavailable'|''}{
 const source=practice.appointments.find(a=>a.id===booking.appointmentId)
 if(source&&source.clientId!==clientId)return {allowed:false,reason:'unavailable'}
 const current=source??booking
 if(current.status==='completed'||current.status==='cancelled')return {allowed:false,reason:'finished'}
 const start=zonedTimestamp(current.date,current.time,practice.profile.timeZone)
 if(!Number.isFinite(start))return {allowed:false,reason:'unavailable'}
 if(start<=now.getTime())return {allowed:false,reason:'past'}
 const hours=practice.bookingRules?.cancellationHours??0
 if(!Number.isFinite(hours)||hours<0)return {allowed:false,reason:'unavailable'}
 if(current.status!=='pending'&&start-now.getTime()<hours*3600000)return {allowed:false,reason:'notice'}
 return {allowed:true,reason:''}
}
