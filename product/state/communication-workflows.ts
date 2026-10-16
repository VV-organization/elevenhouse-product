import {flowConfigurationError,outboundActions,triggerFields,type FlowCalculation} from './flow-palette'
import {aiConfigError,type AIConfig} from './communication-ai'
export type Attachment={id:string;name:string;type:string;size:number;data:string}
export type Channel='portal'|'email'|'telegram'|'whatsapp'|'instagram'|'vk'
export type Contact={id:string;channel:Channel;address:string;source?:'profile'}
export function availableContacts(manual:Contact[],client?:{email?:string;telegram?:string}):Contact[]{
 const merged=[...manual];for(const channel of ['email','telegram'] as const){const address=client?.[channel]?.trim();if(address&&!merged.some(c=>c.channel===channel&&c.address.toLowerCase()===address.toLowerCase()))merged.push({id:`profile-${channel}`,channel,address,source:'profile'})}return merged
}
export function addContact(contacts:Contact[],contact:Contact){
 const address=contact.address.trim();if(!address)throw new Error('address')
 if(contacts.some(c=>c.channel===contact.channel&&c.address.toLowerCase()===address.toLowerCase()))throw new Error('duplicate')
 return [...contacts,{...contact,address}]
}
export type Publication={id:string;title:string;text:string;date:string;time:string;zone:string;status:string;updatedAt?:string;audience?:'public'|'sub';channels?:Channel[];media?:Attachment[];mode?:'draft'|'now'|'schedule';type?:'post'|'video'|'live';request?:'pending';[key:string]:unknown}
export function publicationDefaults(post:Publication):Publication{return {...post,audience:post.audience||'public',channels:post.channels||['portal'],media:post.media||[],type:post.type||'post',mode:post.mode||(post.status==='scheduled'?'schedule':'draft')}}
export function publicationError(post:Publication,today:string){
 if(!post.title.trim()||!post.text.trim())return 'text'
 if(post.mode!=='draft'&&!post.channels?.length)return 'channel'
 if(post.mode==='schedule'){const date=new Date(post.date+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(post.date)||post.date<today||!/^([01]\d|2[0-3]):[0-5]\d$/.test(post.time)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==post.date)return 'date'}return ''
}
export type FlowStep={action?:string;params?:Record<string,string|number>;calculation?:FlowCalculation;ai?:AIConfig;id:string;kind:'condition'|'delay'|'message'|'task'|'calculate'|'ai'|'approval'|'deliver';value:string;amount?:number;unit?:'hours'|'days';channel?:Channel;onFalse?:'stop'|'skip';next?:string|null;branches?:{yes:string|null;no:string|null};repeatLimit?:number}
export type Flow={triggerParams?:Record<string,string|number>;id:string;name:string;text:string;kind:string;status:'paused'|'ready';trigger?:string;leadHours?:number;steps?:FlowStep[];entryId?:string;[key:string]:unknown}
export function flowDefaults(flow:Flow):Flow{return {...flow,leadHours:flow.leadHours??(flow.kind==='before'?24:0),trigger:flow.trigger||(flow.kind==='after'?'completed':flow.kind==='data'?'missing-data':'before'),steps:flow.steps||[{id:flow.id+'-delay',kind:'delay',value:'',amount:flow.kind==='after'?1:0,unit:'days'},{id:flow.id+'-message',kind:'message',value:flow.text,channel:'portal'},{id:flow.id+'-approval',kind:'approval',value:''},{id:flow.id+'-delivery',kind:'deliver',value:'',channel:'portal'}]}}
export type FlowContext={name:string;birthComplete:boolean;hasAppointment:boolean;completed:boolean;paid:boolean;subscribed:boolean;event?:string;conditionResults?:Record<string,boolean>}
export type Trace={stepId:string;status:'pass'|'stop'|'skip'|'wait'|'approval'|'external'|'blocked'|'limit';text:string;conditionResult?:boolean;nextId?:string|null;visit?:number}
export function flowTargets(flow:Flow,step:FlowStep){const steps=flow.steps||[],index=steps.findIndex(s=>s.id===step.id),next=step.next!==undefined?step.next:steps[index+1]?.id??null;return step.kind==='condition'?step.branches??{yes:next,no:step.onFalse==='skip'?next:null}:{yes:next,no:next}}
/** Fix identity-based links before changing visual order. */
export function freezeFlowRoutes(flow:Flow):Flow{return {...flow,entryId:flow.entryId??flow.steps?.[0]?.id,steps:flow.steps?.map(s=>s.kind==='condition'?{...s,branches:flowTargets(flow,s)}:{...s,next:flowTargets(flow,s).yes})}}
export function flowRouteError(flow:Flow):string{
 const steps=flow.steps||[],map=new Map(steps.map(s=>[s.id,s]));if(steps.some(s=>!s.id)||map.size!==steps.length)return 'identity'
 const entry=flow.entryId??steps[0]?.id;if(steps.length&&!map.has(entry!))return 'target'
 for(const s of steps){const targets=flowTargets(flow,s);if([targets.yes,targets.no].some(id=>id!==null&&!map.has(id)))return 'target';if(s.repeatLimit!==undefined&&(s.kind!=='condition'||!Number.isInteger(s.repeatLimit)||s.repeatLimit<1||s.repeatLimit>10))return 'repeat'}
 // Every cycle must pass through a condition with a finite repeat limit.
 const visiting=new Set<string>(),visited=new Set<string>();function cyclic(id:string):boolean{const s=map.get(id)!;if(s.kind==='condition'&&s.repeatLimit!==undefined)return false;if(visiting.has(id))return true;if(visited.has(id))return false;visiting.add(id);for(const to of new Set(Object.values(flowTargets(flow,s))))if(to&&cyclic(to))return true;visiting.delete(id);visited.add(id);return false}
 if(steps.some(s=>cyclic(s.id)))return 'cycle'
 const states=new Set<string>();function unsafe(id:string|null,approved:boolean):boolean{if(id===null)return false;const key=id+':'+approved;if(states.has(key))return false;states.add(key);const s=map.get(id)!;if((s.kind==='deliver'||outboundActions.includes(s.action||''))&&!approved)return true;if(['message','calculate','ai'].includes(s.kind))approved=false;if(s.kind==='ai'&&s.ai?.hitl==='auto')approved=true;if(s.kind==='approval')approved=true;return Object.values(flowTargets(flow,s)).some(to=>unsafe(to,approved))}
 if(entry&&unsafe(entry,false))return 'approval';return ''
}
export function moveFlowStep(flow:Flow,index:number,delta:number){const fixed=freezeFlowRoutes(flow),steps=[...fixed.steps||[]];if(index<0||index>=steps.length||index+delta<0||index+delta>=steps.length)throw new Error('target');[steps[index],steps[index+delta]]=[steps[index+delta],steps[index]];const next={...fixed,steps};const error=flowRouteError(next);if(error)throw new Error(error);return next}
export function removeFlowStep(flow:Flow,id:string){const fixed=freezeFlowRoutes(flow),removed=fixed.steps?.find(s=>s.id===id);if(!removed)return fixed;const referenced=fixed.steps?.some(s=>s.id!==id&&Object.values(flowTargets(fixed,s)).includes(id));if(referenced)throw new Error('referenced');const steps=fixed.steps!.filter(s=>s.id!==id);const next={...fixed,steps,entryId:fixed.entryId===id?(steps.some(s=>s.id===flowTargets(fixed,removed).yes)?flowTargets(fixed,removed).yes!:steps[0]?.id):fixed.entryId};const error=flowRouteError(next);if(error)throw new Error(error);return next}
export function validateFlow(flow:Flow){
 if(!flow.name.trim()||!flow.trigger)return 'name'
 if(flow.trigger==='schedule'&&!String(flow.schedule||'').trim())return 'configuration'
 if(flow.trigger==='before'&&(!Number.isFinite(flow.leadHours)||Number(flow.leadHours)<0))return 'delay'
 if(triggerFields(flow.trigger).some(f=>f.required&&!String(flow.triggerParams?.[f.key]??f.initial??'').trim()))return 'configuration'
 const steps=flow.steps||[];if(!steps.length)return 'steps'
 for(const s of steps){
  if(flowConfigurationError(s))return 'configuration'
  if(s.kind==='ai'&&s.ai&&aiConfigError(s.ai))return 'ai'
  if(['message','task','calculate','ai'].includes(s.kind)&&!s.value.trim()&&!s.calculation&&!(s.action&&s.params&&Object.keys(s.params).length))return 'value'
  if(s.kind==='condition'&&!['birth-complete','appointment','completed','paid','subscribed','chart-condition','value-match','ab'].includes(s.value))return 'condition'
  if(s.kind==='delay'&&(typeof s.amount!=='number'||!Number.isFinite(s.amount)||s.amount<0))return 'delay'
 }
 return flowRouteError(flow)
}
export function traceFlow(flow:Flow,context:FlowContext):Trace[]{
 const error=validateFlow(flow),entry=flow.entryId??flow.steps?.[0]?.id;if(error)return [{stepId:entry??'',status:'blocked',text:error}]
 const result:Trace[]=[],steps=new Map(flow.steps!.map(s=>[s.id,s])),visits=new Map<string,number>();let id:string|null=entry??null
 while(id!==null){const step=steps.get(id)!;const visit=(visits.get(id)??0)+1;visits.set(id,visit);if(step.kind==='condition'&&step.repeatLimit!==undefined&&visit>step.repeatLimit+1){result.push({stepId:id,status:'limit',text:step.value,visit});break}
 const target=flowTargets(flow,step)
 if(step.kind==='condition'){const custom=['chart-condition','value-match','ab'].includes(step.value);if(custom&&context.conditionResults?.[id]===undefined){result.push({stepId:id,status:'blocked',text:'condition-data',visit});break}const pass=custom?context.conditionResults![id]:step.value==='birth-complete'?context.birthComplete:step.value==='appointment'?context.hasAppointment:step.value==='completed'?context.completed:step.value==='paid'?context.paid:context.subscribed;const next=pass?target.yes:target.no;result.push({stepId:id,status:next===null?'stop':'pass',text:step.value,conditionResult:pass,nextId:next,visit});id=next}
 else{const next=target.yes;result.push({stepId:id,status:step.kind==='delay'?'wait':step.kind==='approval'?'approval':(['calculate','ai','deliver'].includes(step.kind)||step.action&&step.kind==='task')?'external':'pass',text:step.value.replace(/\{(name|имя)\}/g,context.name),nextId:next,visit});if(step.kind==='approval')break;id=next}
 }
 return result
}
export type ReviewRecord={id:string;clientId:string;text:string;response:string;rating?:number;status?:'published'|'pending'|'hidden';date?:string;appointmentId?:string;dispute?:{reason:string;state:'prepared'};[key:string]:unknown}
export function reviewAverage(reviews:ReviewRecord[]){const rated=reviews.filter(r=>r.status==='published'&&typeof r.rating==='number'&&r.rating>=1&&r.rating<=5);return rated.length?rated.reduce((sum,r)=>sum+r.rating!,0)/rated.length:null}
export function requestCandidates<T extends {id:string;clientId:string;status:string}>(appointments:T[],reviews:ReviewRecord[],requested:string[]){return appointments.filter(a=>a.status==='completed'&&!reviews.some(r=>r.appointmentId===a.id)&&!requested.includes(a.id))}
