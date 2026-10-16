import type {Appointment} from './model'
export type JournalEntry = {id:string;clientId:string;date:string;time:string;author:'client'|'specialist';kind:'note'|'reply'|'summary';text:string;appointmentId?:string;appointmentTitle?:string;appointmentStatus?:Appointment['status']}
export function clientJournalEntries(entries:JournalEntry[], appointments:Appointment[], clientId:string):JournalEntry[] {
 const outcomes:JournalEntry[] = appointments.filter(appointment => appointment.clientId === clientId && appointment.outcome?.trim()).map(appointment => ({id:`appointment-${appointment.id}`,clientId,date:appointment.date,time:appointment.time,author:'specialist',kind:'summary',text:appointment.outcome!,appointmentId:appointment.id,appointmentTitle:appointment.title,appointmentStatus:appointment.status}))
 return [...entries.filter(entry => entry.clientId === clientId),...outcomes].sort((a,b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
}
