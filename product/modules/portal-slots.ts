import type {Practice} from '../state/model'
import {checkBookingRules,availabilityForDate} from '../state/bookingRules'
import {validDate} from '../state/commerce-model'
import {tr} from '../i18n'
export function localDate(now:Date,zone:string){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
/** Resolve wall-clock time in the astrologer's zone, rejecting DST gaps. */
export function zonedTimestamp(date:string,time:string,zone:string){const target=Date.parse(`${date}T${time}:00Z`);if(!Number.isFinite(target))return NaN;let guess=target;const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});for(let i=0;i<4;i++){const p=Object.fromEntries(formatter.formatToParts(new Date(guess)).map(p=>[p.type,p.value]));const wall=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);if(wall===target)return guess;guess+=target-wall}return NaN}
export function portalAvailability(practice:Practice,date:string,duration:number,now=new Date()):{slots:string[];reason:string}{
 const r=practice.bookingRules;if(!r?.enabled)return {slots:[],reason:tr('Астролог ещё не открыл время для самостоятельной записи. Можно написать и согласовать встречу.','Your astrologer has not opened self-booking yet. You can message them to arrange an appointment.')}
 if(!validDate(date)||!Number.isFinite(duration)||duration<=0)return {slots:[],reason:tr('Выберите дату.','Choose a date.')}
 const today=localDate(now,practice.profile.timeZone),horizon=new Date(`${today}T12:00:00Z`);horizon.setUTCDate(horizon.getUTCDate()+r.horizonDays)
 if(date<today||date>horizon.toISOString().slice(0,10))return {slots:[],reason:tr(`Запись открыта на ${r.horizonDays} дней вперёд.`,`Booking is open ${r.horizonDays} days ahead.`)}
 const availability=availabilityForDate(r,date)
 if(availability.closed)return {slots:[],reason:tr('В этот день астролог не принимает. Выберите другую дату.','Your astrologer is unavailable on this date. Choose another day.')}
 const minute=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3)),slots:string[]=[]
 for(let n=minute(availability.start);n+duration<=minute(availability.end);n+=Math.max(1,r.slotMinutes)){const time=`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;const timestamp=zonedTimestamp(date,time,practice.profile.timeZone);if(!Number.isFinite(timestamp)||timestamp<now.getTime()+r.leadHours*3600000)continue;try{checkBookingRules(practice,{date,time,duration});slots.push(time)}catch{/* A busy or unavailable slot is not offered. */}}
 return {slots,reason:slots.length?'':tr('На эту дату свободного времени нет. Выберите другой день или напишите астрологу.','No times are available on this date. Choose another day or message your astrologer.')}
}
