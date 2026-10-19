import type {LearningState} from './learning'
import type {Appointment,Client,Practice} from './model'

export type JourneyKind='prepare'|'birth'|'calculation'|'material'|'reminder'|'waiting'|'outcome'|'followup'|'payment'
export type JourneyProgress={appointmentId?:string;paused?:boolean;skipped?:JourneyKind[];working?:JourneyKind}
export type JourneyStep={kind:JourneyKind;appointment:Appointment;client:Client}

export function appointmentHasEnded(appointment:Appointment,timeZone:string,now:Date):boolean{
 if(appointment.status==='completed')return true
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now)
 const part=(name:string)=>parts.find(p=>p.type===name)?.value||''
 const date=`${part('year')}-${part('month')}-${part('day')}`
 const [hour,minute]=appointment.time.split(':').map(Number)
 return date>appointment.date||(date===appointment.date&&Number(part('hour'))*60+Number(part('minute'))>=hour*60+minute+appointment.duration)
}

/** All transitions use saved data; visiting a screen is not a completed task. */
export function nextJourneyStep(practice:Practice,state:LearningState,now:Date):JourneyStep|null{
 if(!state.enabled||state.journey?.paused)return null
 const appointment=state.journey?.appointmentId?practice.appointments.find(a=>a.id===state.journey?.appointmentId):practice.appointments.find(a=>a.status!=='cancelled')
 const client=practice.clients.find(c=>c.id===appointment?.clientId)
 if(!appointment||!client||appointment.status==='cancelled')return null
 const done=(topic:string)=>state.completed.includes(topic)
 const skipped=(kind:JourneyKind)=>state.journey?.skipped?.includes(kind)
 const result=(kind:JourneyKind):JourneyStep=>({kind,appointment,client})
 const ended=appointmentHasEnded(appointment,practice.profile.timeZone,now)
 if(!ended){
  const prepared=state.journey?.working==='prepare'?done(`preparation:${client.id}`):!!(client.request.trim()||client.notes.trim())
  if(!prepared&&!skipped('prepare'))return result('prepare')
  if(!skipped('calculation')){
   if((!client.birthDate||!client.birthPlace||(!client.birthTime&&!client.unknownTime))&&!skipped('birth'))return result('birth')
   if(!done(`calculation-saved:${client.id}`))return result('calculation')
  }
 }
 if(ended){
  if(!appointment.outcome?.trim()&&!skipped('outcome'))return result('outcome')
  const followup=practice.appointments.some(a=>a.id!==appointment.id&&a.clientId===client.id&&a.status!=='cancelled'&&a.date+a.time>appointment.date+appointment.time)
  if(!followup&&!skipped('followup'))return result('followup')
  if((appointment.price||0)>0&&!done(`payment:${appointment.id}`)&&!skipped('payment'))return result('payment')
  return null
 }
 if(!done('library')&&!skipped('material'))return result('material')
 if(!done('astro-calendar')&&!skipped('reminder'))return result('reminder')
 return result('waiting')
}
