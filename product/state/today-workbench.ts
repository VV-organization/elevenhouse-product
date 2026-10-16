import type {Practice} from './model'
export type Brief={id:string;appointmentId:string;clientId:string;text:string;source:string;generatedAt:string}
export type Approval={id:string;revision:string;title:string;description:string;clientId?:string;appointmentId?:string;kind:'message'|'brief'|'workflow'|'dispute';recipient:string;content:string;status:'pending'|'approved'|'rejected';createdAt:string}
export type ApprovalDecision={id:string;revision:string;choice:'approve'|'reject';text:string;at:string}
export type SkyToday={date:string;phase:string;sign:string;illumination?:number;source:string;transits:Array<{id:string;title:string;description:string}>}
export type TodayData={sky?:SkyToday;briefs?:Brief[];approvals?:Approval[];loadSky?:(date:string)=>Promise<SkyToday>;prepareBrief?:(appointmentId:string,clientId:string)=>Promise<Brief>;decide?:(decision:ApprovalDecision)=>Promise<{id:string;revision:string;status:'approved'|'rejected'}>}
export function validSky(s:SkyToday,date:string){return s.date===date&&!!s.source.trim()&&!!s.phase.trim()&&!!s.sign.trim()&&(s.illumination===undefined||Number.isFinite(s.illumination)&&s.illumination>=0&&s.illumination<=100)&&Array.isArray(s.transits)&&s.transits.every(t=>!!t.id&&!!t.title)}
export function briefMatches(b:Brief,appointmentId:string,practice:Practice){const a=practice.appointments.find(a=>a.id===appointmentId);return !!a&&b.appointmentId===a.id&&b.clientId===a.clientId&&!!b.text.trim()&&!!b.source.trim()&&Number.isFinite(Date.parse(b.generatedAt))}
export function validApproval(a:Approval,p:Practice){return !!a.id&&!!a.revision&&!!a.recipient.trim()&&!!a.content.trim()&&(!a.clientId||p.clients.some(c=>c.id===a.clientId))&&(!a.appointmentId||p.appointments.some(m=>m.id===a.appointmentId&&(!a.clientId||a.clientId===m.clientId)))}
export function decisionKey(a:Pick<Approval,'id'|'revision'>){return `${a.id}:${a.revision}`}
