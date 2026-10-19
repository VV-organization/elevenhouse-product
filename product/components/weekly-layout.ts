import {checkBookingRules} from '../state/bookingRules'
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

/** Manual one-hour entry points; unavailable periods never become booking buttons. */
export function scheduleSlots(practice:Practice,date:string,range:{start:number;end:number}){
 const appointments=practice.appointments.filter(a=>a.date===date&&a.status!=='cancelled')
 const slots:number[]=[]
 for(let start=range.start;start+60<=range.end;start+=60){
  if(appointments.some(a=>start<timeMinutes(a.time)+a.duration&&timeMinutes(a.time)<start+60))continue
  try{checkBookingRules(practice,{date,time:clockTime(start),duration:60});slots.push(start)}catch{/* A rule closes this entry point. */}
 }
 return slots
}
export function clockTime(minutes:number){return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`}
