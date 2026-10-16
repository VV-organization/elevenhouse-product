import type {Practice} from '../state/model'
import type {Payment} from './ServicesFinance'
import type {AnalyticsEvidence} from './commerce-analytics-model'
import {availableIntervals} from '../state/bookingRules'
import {zonedTimestamp,localDate} from './portal-slots'
export type AnalyticsGoal={period:'month'|'year';start:string;target:number}
export type AnalyticsExtraEvidence={sales?:{paymentId:string;at:string}[];reschedules?:{appointmentId:string;at:string}[];forecast?:{from:string;to:string;asOf:string;amount:number;method:string}}
export function goalError(g:AnalyticsGoal){return !/^\d{4}-\d{2}-01$/.test(g.start)||!Number.isFinite(Date.parse(g.start))||!Number.isInteger(g.target)||g.target<=0||(g.period==='year'&&!g.start.endsWith('-01-01'))}
export function goalRange(g:AnalyticsGoal){const end=new Date(`${g.start}T12:00:00Z`);if(g.period==='year')end.setUTCFullYear(end.getUTCFullYear()+1);else end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(end.getUTCDate()-1);return {from:g.start,to:end.toISOString().slice(0,10)}}
export function goalProgress(g:AnalyticsGoal,payments:Payment[]){if(goalError(g))return null;const range=goalRange(g),received=payments.filter(p=>p.status==='paid'&&(p.receivedDate??p.date)>=range.from&&(p.receivedDate??p.date)<=range.to).reduce((n,p)=>n+p.amount-p.commission,0);return {received,remaining:Math.max(0,g.target-received),percent:received/g.target*100,range}}
const minute=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3))
export function detailedAnalytics(payments:Payment[],practice:Practice,range:{from:string;to:string},evidence:AnalyticsEvidence,extra:AnalyticsExtraEvidence={},now=new Date()){
 const inside=(s:string)=>s.slice(0,10)>=range.from&&s.slice(0,10)<=range.to
 const paid=payments.filter(p=>p.status==='paid'&&inside(p.receivedDate??p.date))
 const allPaid=payments.filter(p=>p.status==='paid'&&(p.receivedDate??p.date)<=range.to)
 const ltv=[...new Set(allPaid.map(p=>p.clientId))].map(id=>{const rows=allPaid.filter(p=>p.clientId===id);return {id,name:practice.clients.find(c=>c.id===id)?.name??id,orders:rows.length,gross:rows.reduce((n,p)=>n+p.amount,0),net:rows.reduce((n,p)=>n+p.amount-p.commission,0)}}).sort((a,b)=>b.gross-a.gross)
 const segments=[...new Set(practice.clients.map(c=>c.stage||'unknown'))].map(id=>({id,label:practice.clientStages?.find(s=>s.id===id)?.label||id,clients:practice.clients.filter(c=>(c.stage||'unknown')===id).length,net:paid.filter(p=>practice.clients.some(c=>c.id===p.clientId&&(c.stage||'unknown')===id)).reduce((n,p)=>n+p.amount-p.commission,0)}))
 const tags=[...new Set(practice.clients.flatMap(c=>c.tags||[]))].map(tag=>({tag,clients:practice.clients.filter(c=>c.tags?.includes(tag)).length,net:paid.filter(p=>practice.clients.some(c=>c.id===p.clientId&&c.tags?.includes(tag))).reduce((n,p)=>n+p.amount-p.commission,0)}))
 const appointments=practice.appointments.filter(a=>inside(a.date)),past=appointments.filter(a=>a.status!=='cancelled'&&zonedTimestamp(a.date,a.time,practice.profile.timeZone)<now.getTime())
 const knownAttendance=past.filter(a=>a.status==='completed'||a.attendance==='no-show'),noShow=knownAttendance.filter(a=>a.attendance==='no-show').length
 const sales=paid.flatMap(p=>{const item=extra.sales?.find(s=>s.paymentId===p.id&&/T\d\d:\d\d/.test(s.at)&&/(Z|[+-]\d{2}:\d{2})$/.test(s.at)&&Number.isFinite(Date.parse(s.at)));if(!item||localDate(new Date(item.at),practice.profile.timeZone)!==(p.receivedDate??p.date).slice(0,10))return [];return [{payment:p,hour:Number(new Intl.DateTimeFormat('en-GB',{timeZone:practice.profile.timeZone,hour:'2-digit',hourCycle:'h23'}).format(new Date(item.at)))}]})
 const hours=Array.from({length:24},(_,hour)=>({hour,sales:sales.filter(s=>s.hour===hour).length,revenue:sales.filter(s=>s.hour===hour).reduce((n,s)=>n+s.payment.amount,0),bookedMinutes:appointments.filter(a=>a.status!=='cancelled').reduce((n,a)=>n+Math.max(0,Math.min(minute(a.time)+a.duration,(hour+1)*60)-Math.max(minute(a.time),hour*60)),0),availableMinutes:0}))
 let totalAvailable=0
 const availableKnown=!!practice.bookingRules?.enabled&&(Date.parse(range.to)-Date.parse(range.from))/86400000<3660
 if(availableKnown&&practice.bookingRules){const cursor=new Date(range.from+'T12:00:00Z'),end=new Date(range.to+'T12:00:00Z');for(let count=0;cursor<=end&&count<3660;count++,cursor.setUTCDate(cursor.getUTCDate()+1)){const intervals=availableIntervals(practice.bookingRules,cursor.toISOString().slice(0,10));for(const {start,end:finish} of intervals){for(const h of hours){const n=Math.max(0,Math.min(finish,(h.hour+1)*60)-Math.max(start,h.hour*60));h.availableMinutes+=n;totalAvailable+=n}}}}
 const leads=evidence.events.filter(e=>e.kind==='lead'),paidEvents=evidence.events.filter(e=>e.kind==='paid'&&e.paymentId&&paid.some(p=>p.id===e.paymentId&&p.clientId===e.clientId))
 const conversionHours=paidEvents.flatMap(e=>{const lead=leads.filter(l=>l.visitorId===e.visitorId&&Date.parse(l.at)<=Date.parse(e.at)).sort((a,b)=>a.at.localeCompare(b.at))[0];if(!lead||!e.at.includes('T')||!lead.at.includes('T'))return [];return [(Date.parse(e.at)-Date.parse(lead.at))/3600000]})
 const reschedules=extra.reschedules?.filter(e=>inside(e.at)&&appointments.some(a=>a.id===e.appointmentId))
 const forecast=extra.forecast&&extra.forecast.from===range.from&&extra.forecast.to===range.to&&Number.isFinite(extra.forecast.amount)&&extra.forecast.amount>=0&&extra.forecast.method.trim()?extra.forecast:null
 return {ltv,averageLtv:ltv.length?ltv.reduce((n,c)=>n+c.gross,0)/ltv.length:null,segments,tags,hours,timedSales:sales.length,untimedSales:paid.length-sales.length,totalAvailable:availableKnown?totalAvailable:null,bookedMinutes:hours.reduce((n,h)=>n+h.bookedMinutes,0),noShow,knownAttendance:knownAttendance.length,unknownAttendance:past.length-knownAttendance.length,noShowRate:knownAttendance.length?noShow/knownAttendance.length:null,conversionHours:conversionHours.length?conversionHours.reduce((n,v)=>n+v,0)/conversionHours.length:null,reschedules:reschedules?.length??null,forecast}
}
