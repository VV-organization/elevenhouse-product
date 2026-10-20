import {availabilityForDate,checkBookingRules} from '../state/bookingRules'
import {tr} from '../i18n'
import type {Practice,Appointment} from '../state/model'
export const WEEK_MINUTE_HEIGHT=1.8
export const MIN_MEETING_HEIGHT=44
export function visualDuration(duration:number){return Math.max(duration,MIN_MEETING_HEIGHT/WEEK_MINUTE_HEIGHT)}
export function timeMinutes(time:string){const [hours,minutes]=time.split(':').map(Number);return hours*60+minutes}
export function weeklyRange(appointments:Appointment[]){return {start:Math.min(9*60,...appointments.map(a=>Math.floor(timeMinutes(a.time)/60)*60)),end:Math.max(18*60,...appointments.map(a=>Math.ceil((timeMinutes(a.time)+visualDuration(a.duration))/60)*60))}}
/** Separate visually overlapping appointments into lanes; linked overlap groups share a lane count. */
export function appointmentLanes(appointments:Appointment[]){
 const result:{appointment:Appointment;lane:number;lanes:number}[]=[],ends:number[]=[]
 let group:typeof result=[],groupEnd=-1
 function finish(){for(const item of group)item.lanes=ends.length;group=[];ends.length=0}
 for(const appointment of [...appointments].sort((a,b)=>a.time.localeCompare(b.time)||b.duration-a.duration)){
  const start=timeMinutes(appointment.time),end=start+visualDuration(appointment.duration)
  if(start>=groupEnd)finish()
  let lane=ends.findIndex(value=>value<=start);if(lane<0)lane=ends.length
  ends[lane]=end;groupEnd=Math.max(groupEnd,end)
  const item={appointment,lane,lanes:1};result.push(item);group.push(item)
 }
 finish();return result
}

/** Entry points for the one-hour booking draft. Step changes their density, not the booked duration. */
export function scheduleSlots(practice:Practice,date:string,range:{start:number;end:number},step:30|60=60){
 const appointments=practice.appointments.filter(a=>a.date===date&&a.status!=='cancelled')
 const slots:number[]=[]
 for(let start=range.start;start+60<=range.end;start+=step){
  if(appointments.some(a=>start<timeMinutes(a.time)+a.duration&&timeMinutes(a.time)<start+60))continue
  try{checkBookingRules(practice,{date,time:clockTime(start),duration:60});slots.push(start)}catch{/* A rule closes this entry point. */}
 }
 return slots
}
export function clockTime(minutes:number){return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`}

type ScheduleSegment={start:number;end:number;kind:'free'|'busy'|'closed';label?:string;duration?:number}
/** Partition actual wall-clock time, independently of the default booking duration. */
export function scheduleSegments(practice:Practice,date:string,range:{start:number;end:number}):ScheduleSegment[]{
 const meetings=practice.appointments.filter(a=>a.date===date&&a.status!=='cancelled')
 const busy=meetings.map(a=>({start:timeMinutes(a.time),end:timeMinutes(a.time)+a.duration}))
 const blocked:Array<{start:number;end:number;label:string}>=[]
 const rules=practice.bookingRules
 if(rules?.enabled){
  const available=availabilityForDate(rules,date)
  if(available.closed)blocked.push({...range,label:tr('Выходной','Day off')})
  else{
   const label=tr('Вне рабочих часов','Outside working hours')
   blocked.push({start:range.start,end:timeMinutes(available.start),label},{start:timeMinutes(available.end),end:range.end,label})
   for(const b of available.blocked)blocked.push({start:timeMinutes(b.start),end:timeMinutes(b.end),label:b.reason||tr('Перерыв','Break')})
   const bufferLabel=tr('Перерыв по правилам записи','Booking buffer')
   for(const b of available.blocked)blocked.push({start:timeMinutes(b.start)-rules.bufferAfter,end:timeMinutes(b.end)+rules.bufferBefore,label:bufferLabel})
   for(const b of busy)blocked.push({start:b.start-rules.bufferBefore-rules.bufferAfter,end:b.end+rules.bufferAfter+rules.bufferBefore,label:bufferLabel})
   if(meetings.length>=rules.maxPerDay)blocked.push({...range,label:tr('Лимит встреч на день','Daily appointment limit')})
  }
 }
 const boundaries=[...new Set([range.start,range.end,...[...busy,...blocked].flatMap(b=>[Math.max(range.start,Math.min(range.end,b.start)),Math.max(range.start,Math.min(range.end,b.end))])])].sort((a,b)=>a-b)
 const intervals:ScheduleSegment[]=[]
 for(let i=0;i<boundaries.length-1;i++){
  const start=boundaries[i],end=boundaries[i+1]
  const occupied=busy.some(b=>b.start<end&&b.end>start),block=blocked.find(b=>b.start<end&&b.end>start)
  const kind=occupied?'busy':block?'closed':'free',label=occupied?undefined:block?.label
  const previous=intervals[intervals.length-1]
  if(previous?.kind===kind&&previous.label===label)previous.end=end
  else intervals.push({start,end,kind,label})
 }
 return intervals.flatMap(interval=>{
  if(interval.kind!=='free')return [interval]
  const slots:ScheduleSegment[]=[]
  for(let start=interval.start;start<interval.end;){
   const end=Math.min(interval.end,(Math.floor(start/30)+1)*30)
   slots.push({start,end,kind:'free',duration:Math.min(60,interval.end-start)})
   start=end
  }
  return slots
 })
}
