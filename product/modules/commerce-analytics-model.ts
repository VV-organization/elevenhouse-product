import type {Payment} from './ServicesFinance'
import type {Practice} from '../state/model'
export type AcquisitionEvent={id:string;visitorId:string;at:string;source:string;kind:'visit'|'lead'|'booking'|'paid';clientId?:string;paymentId?:string}
export type SubscriptionCohort={id:string;periodEnd:string;eligible:number;renewed:number}
export type AnalyticsEvidence={events:AcquisitionEvent[];cohorts:SubscriptionCohort[];coverage?:{from:string;to:string}}
export const emptyAnalyticsEvidence=():AnalyticsEvidence=>({events:[],cohorts:[]})
export function ratio(n:number,d:number){return d>0?n/d:null}
export function practiceAnalytics(payments:Payment[],practice:Practice,range:{from:string;to:string},evidence:AnalyticsEvidence=emptyAnalyticsEvidence(),source='all'){
 const inside=(date:string)=>date.slice(0,10)>=range.from&&date.slice(0,10)<=range.to
 const received=(p:Payment)=>p.receivedDate??p.date
 const allPaid=payments.filter(p=>p.status==='paid'&&received(p)<=range.to)
 const paid=allPaid.filter(p=>inside(received(p)))
 const clientIds=[...new Set(paid.map(p=>p.clientId))]
 const returning=clientIds.filter(id=>allPaid.filter(p=>p.clientId===id).length>1)
 const appointments=practice.appointments.filter(a=>inside(a.date))
 const events=evidence.events.filter(e=>inside(e.at)&&(source==='all'||e.source===source))
 const coverage=!!evidence.coverage&&evidence.coverage.from<=range.from&&evidence.coverage.to>=range.to
 const visitors=(kind:AcquisitionEvent['kind'])=>new Set(events.filter(e=>e.kind===kind).map(e=>e.visitorId))
 const visits=visitors('visit'),leads=visitors('lead'),bookings=visitors('booking')
 // A conversion must be backed by an exact paid receipt and the same visitor's preceding step.
 const paidEvents=events.filter(e=>e.kind==='paid'&&e.paymentId&&paid.some(p=>p.id===e.paymentId&&p.clientId===e.clientId))
 const payers=new Set(paidEvents.map(e=>e.visitorId))
 const transitioned=(from:AcquisitionEvent['kind'],to:AcquisitionEvent['kind'])=>{const ends=to==='paid'?paidEvents:events.filter(e=>e.kind===to);return new Set(ends.filter(end=>events.some(start=>start.kind===from&&start.visitorId===end.visitorId&&start.at<=end.at)).map(e=>e.visitorId)).size}
 const cohorts=evidence.cohorts.filter(c=>inside(c.periodEnd)&&Number.isInteger(c.eligible)&&Number.isInteger(c.renewed)&&c.eligible>=0&&c.renewed>=0&&c.renewed<=c.eligible)
 const eligible=cohorts.reduce((n,c)=>n+c.eligible,0),renewed=cohorts.reduce((n,c)=>n+c.renewed,0)
 const attributedIds=new Set(evidence.events.filter(e=>inside(e.at)&&e.kind==='paid'&&e.paymentId&&paid.some(p=>p.id===e.paymentId&&p.clientId===e.clientId)).map(e=>e.paymentId))
 return {paid,clientIds,returning,repeatShare:ratio(returning.length,clientIds.length),averageOrder:paid.length?paid.reduce((n,p)=>n+p.amount,0)/paid.length:null,
  appointments,completed:appointments.filter(a=>a.status==='completed').length,cancelled:appointments.filter(a=>a.status==='cancelled').length,
  weekdays:Array.from({length:7},(_,day)=>appointments.filter(a=>a.status!=='cancelled'&&(new Date(`${a.date}T12:00:00Z`).getUTCDay()+6)%7===day).length),
  sources:[...new Set(evidence.events.map(e=>e.source))].sort(),unattributed:paid.filter(p=>!attributedIds.has(p.id)),coverage,
  funnel:{visits:coverage?visits.size:null,leads:coverage?leads.size:null,bookings:coverage?bookings.size:null,paid:coverage?payers.size:null},
  visitToLead:coverage?ratio(transitioned('visit','lead'),visits.size):null,leadToPaid:coverage?ratio(transitioned('lead','paid'),leads.size):null,
  retention:ratio(renewed,eligible),eligible,renewed,
  sourcePayments:paid.filter(p=>paidEvents.some(e=>e.paymentId===p.id)),
 }
}
