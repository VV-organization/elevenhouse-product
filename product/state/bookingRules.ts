import {tr} from '../i18n'
import type {Appointment,Practice} from './model'
export type WeeklyHours={day:number;start:string;end:string}
export type BlockedTime={id:string;date:string;start:string;end:string;reason?:string}
export type BookingRules={enabled:boolean; days:number[]; start:string; end:string; bufferBefore:number; bufferAfter:number; maxPerDay:number; slotMinutes:number; leadHours:number; horizonDays:number; rescheduleHours:number; cancellationHours?:number; lateFee:number; noShowFee:number; graceMinutes:number; weeklyHours?:WeeklyHours[]; blockedTimes?:BlockedTime[]; exceptions?:Array<{date:string;closed:boolean;start:string;end:string}>}
export const DEFAULT_BOOKING_RULES:BookingRules={enabled:false,days:[1,2,3,4,5],start:'09:00',end:'18:00',bufferBefore:0,bufferAfter:15,maxPerDay:6,slotMinutes:60,leadHours:12,horizonDays:60,rescheduleHours:24,cancellationHours:0,lateFee:0,noShowFee:0,graceMinutes:15}
const validHours=(start:string,end:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(start)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(end)&&start<end
const validDay=(date:string)=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date
const minute=(v:string)=>Number(v.slice(0,2))*60+Number(v.slice(3))
export function validateBookingRules(r:BookingRules){
 if(!r.days.length||r.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw new Error(tr('Выберите хотя бы один рабочий день.','Choose at least one working day.'))
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.end)||r.start>=r.end)throw new Error(tr('Окончание приёма должно быть позже начала.','Availability must end after it starts.'))
 for(const k of ['bufferBefore','bufferAfter','leadHours','rescheduleHours','lateFee','noShowFee','graceMinutes'] as const)if(!Number.isFinite(r[k])||r[k]<0)throw new Error(tr('Проверьте правила записи.','Check booking rules.'))
 if(r.cancellationHours!==undefined&&(!Number.isFinite(r.cancellationHours)||r.cancellationHours<0||r.cancellationHours>168))throw new Error(tr('Проверьте срок самостоятельной отмены.','Check the self-cancellation notice period.'))
 if(r.lateFee>100||r.noShowFee>100||!Number.isInteger(r.maxPerDay)||r.maxPerDay<1||r.slotMinutes<1||r.horizonDays<1)throw new Error(tr('Проверьте лимиты записи.','Check booking limits.'))
 const seen=new Set<string>();for(const e of r.exceptions||[]){if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date+'T12:00:00Z'))||new Date(e.date+'T12:00:00Z').toISOString().slice(0,10)!==e.date||seen.has(e.date))throw new Error(tr('Укажите разные корректные даты исключений.','Choose distinct valid exception dates.'));seen.add(e.date);if(!e.closed&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.end)||e.start>=e.end))throw new Error(tr('Проверьте время приёма на отдельную дату.','Check availability for the selected date.'))}
 const weeklyDays=new Set<number>()
 for(const w of r.weeklyHours||[]){if(!Number.isInteger(w.day)||w.day<0||w.day>6||weeklyDays.has(w.day)||!validHours(w.start,w.end))throw new Error(tr('Проверьте отдельные часы по дням недели.','Check individual weekday hours.'));weeklyDays.add(w.day)}
 const blockIds=new Set<string>()
 for(const b of r.blockedTimes||[]){if(!b.id||blockIds.has(b.id)||!validDay(b.date)||!validHours(b.start,b.end))throw new Error(tr('Для перерыва укажите корректные дату и время окончания после начала.','Choose a valid date and an end time after the start for each break.'));blockIds.add(b.id)}
 return r
}
export function availabilityForDate(r:BookingRules,date:string){
 const day=new Date(date+'T12:00:00Z').getUTCDay(),weekly=r.weeklyHours?.find(w=>w.day===day),exception=r.exceptions?.find(e=>e.date===date)
 const hours=exception?{closed:exception.closed,start:exception.start,end:exception.end}:{closed:!r.days.includes(day),start:weekly?.start??r.start,end:weekly?.end??r.end}
 return {...hours,blocked:(r.blockedTimes||[]).filter(b=>b.date===date)}
}
/** Free wall-clock intervals, with overlapping private blocks subtracted only once. */
export function availableIntervals(r:BookingRules,date:string):Array<{start:number;end:number}>{
 const a=availabilityForDate(r,date);if(a.closed)return []
 let intervals=[{start:minute(a.start),end:minute(a.end)}]
 for(const b of a.blocked){const start=minute(b.start),end=minute(b.end);intervals=intervals.flatMap(i=>end<=i.start||start>=i.end?[i]:[{start:i.start,end:Math.min(start,i.end)},{start:Math.max(end,i.start),end:i.end}].filter(x=>x.start<x.end))}
 return intervals
}
/** Report conflicts without changing any saved appointment. */
export function bookingRuleConflicts(p:Practice,r:BookingRules){
 if(!r.enabled)return []
 try{validateBookingRules(r)}catch{return []}
 return p.appointments.filter(a=>a.status==='confirmed').flatMap(appointment=>{try{checkBookingRules({...p,bookingRules:r},appointment,appointment.id);return []}catch(error){return [{appointment,reason:(error as Error).message}]}})
}
/** Manual bookings respect working hours/capacity. Lead/horizon apply only to client self-booking. */
export function checkBookingRules(p:Practice,input:Pick<Appointment,'date'|'time'|'duration'>,exceptId?:string){
 const r=p.bookingRules;if(!r?.enabled)return
 validateBookingRules(r)
 const start=minute(input.time),end=start+input.duration
 const available=availabilityForDate(r,input.date)
 if(available.closed||start<minute(available.start)||end>minute(available.end))throw new Error(tr('Встреча выходит за рабочие часы. Выберите другое время или измените доступность в календаре.','This appointment is outside your working hours. Choose another time or update calendar availability.'))
 if(available.blocked.some(b=>start-r.bufferBefore<minute(b.end)&&minute(b.start)<end+r.bufferAfter))throw new Error(tr('Это время закрыто для записи или не оставляет нужного перерыва. Выберите другое время.','This time is unavailable or leaves insufficient buffer. Choose another time.'))
 const day=p.appointments.filter(a=>a.id!==exceptId&&a.date===input.date&&a.status!=='cancelled')
 if(day.length>=r.maxPerDay)throw new Error(tr('Достигнут лимит встреч на этот день.','The daily appointment limit has been reached.'))
 if(day.some(a=>start-r.bufferBefore<minute(a.time)+a.duration+r.bufferAfter&&minute(a.time)-r.bufferBefore<end+r.bufferAfter))throw new Error(tr('Между встречами не хватает времени на перерыв. Выберите другое время.','There is not enough buffer time between appointments. Choose another time.'))
}
