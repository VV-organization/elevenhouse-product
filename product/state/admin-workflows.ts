import type {AdminAnalyticsData} from '../modules/admin-analytics'
export type AdminRole='admin'|'moderator'
export type AdminRecord={id:string;kind:'user'|'verification'|'moderation'|'dispute';name:string;title?:string;description?:string;status?:string;role?:'practitioner'|'client';email?:string;plan?:string;gmv?:number;balance?:number;activity?:string;joined?:string;lastSeen?:string;specialization?:string;publicUrl?:string;stage1?:'pending'|'interview'|'approved'|'rejected';kyc?:'none'|'pending'|'passed'|'failed';vendorUrl?:string;documents?:{name:string;url?:string}[];contentKind?:'review'|'post'|'profile'|'product'|'page';aiNote?:string;reporter?:string;orderId?:string;paymentId?:string;paidAmount?:number;refundedAmount?:number;currency?:string;client?:AdminDisputeParty;practitioner?:AdminDisputeParty;clientMessage?:string;practitionerMessage?:string;sla?:string;history?:string[]}
export type AdminAction='block'|'unblock'|'profile-approve'|'profile-reject'|'profile-interview'|'kyc-request'|'kyc-retry'|'kyc-pass'|'kyc-fail'|'moderation-approve'|'moderation-hide'|'moderation-reject'|'moderation-escalate'|'refund-full'|'refund-partial'|'dispute-reject'|'message'|'config'
export type AdminRequest={id:string;target:string;kind:AdminAction;reason:string;actor:string;payload:Record<string,unknown>;createdAt:string;status:'prepared'|'cancelled'}
export type AdminDraft=Record<string,string|number|boolean|string[]>
export type AdminWorkspaceState={requests:AdminRequest[];drafts:Record<string,AdminDraft>}
export type AdminServerData={role?:AdminRole;analytics?:AdminAnalyticsData;activity?:{id:string;title:string;description:string;time:string}[];records?:AdminRecord[];configs?:Record<string,AdminDraft>;results?:{requestId:string;status:'confirmed'|'failed';message:string;confirmedAt:string}[]}
export const emptyAdminWorkspace=():AdminWorkspaceState=>({requests:[],drafts:{}})
export function safeAdminUrl(value?:string){try{const u=new URL(value||'');return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
const protectedActions:AdminAction[]=['block','unblock','refund-full','refund-partial','dispute-reject','config']
export function adminActionError(role:AdminRole,record:AdminRecord,action:AdminAction,payload:Record<string,unknown>,reason:string,requests:AdminRequest[]=[]):string{
 if(role!=='admin'&&protectedActions.includes(action))return 'permission'
 if(!record.id||!reason.trim())return 'reason'
 const group=(a:AdminAction)=>a.startsWith('profile-')?'profile':a.startsWith('kyc-')?'kyc':a.startsWith('moderation-')?'moderation':a.startsWith('refund-')||a==='dispute-reject'?'dispute':a==='block'||a==='unblock'?'access':a
 if(requests.some(r=>r.target===record.id&&r.status==='prepared'&&group(r.kind)===group(action)&&(action!=='message'||r.payload.recipientId===payload.recipientId)))return 'duplicate'
 if(action==='config'){if(record.id.startsWith('plan:')&&requests.some(r=>r.kind==='config'&&r.target==='plans-reset'&&r.status==='prepared'))return 'duplicate';return ''}
 if(action==='message'){if(record.kind==='dispute'&&!disputeMessageRecipient(record,payload))return 'recipient';return !String(payload.body||'').trim()||!['inapp','email','push'].includes(String(payload.channel))?'message':''}
 if(action==='block'||action==='unblock')return record.kind!=='user'||(action==='block'&&record.status!=='active')||(action==='unblock'&&record.status!=='suspended')?'state':''
 if(action.startsWith('profile-'))return record.kind!=='verification'||record.stage1==='approved'?'state':''
 if(action.startsWith('kyc-')){if(record.kind!=='verification'||record.stage1!=='approved')return 'stage';if(action==='kyc-request'&&record.kyc!=='none'||action==='kyc-retry'&&record.kyc!=='failed'||['kyc-pass','kyc-fail'].includes(action)&&record.kyc!=='pending')return 'state';if(['kyc-pass','kyc-fail'].includes(action)&&!String(payload.vendorReference||'').trim())return 'evidence';return ''}
 if(action.startsWith('moderation-'))return record.kind!=='moderation'||record.status==='resolved'?'state':''
 if(action.startsWith('refund-')||action==='dispute-reject'){
  if(record.kind!=='dispute'||record.status==='resolved'||!record.orderId)return 'state'
  if(action==='dispute-reject')return ''
  if(!record.paymentId||!Number.isFinite(record.paidAmount)||!Number.isFinite(record.refundedAmount)||!record.currency)return 'payment'
  if(record.paidAmount!<0||record.refundedAmount!<0||record.refundedAmount!>record.paidAmount!)return 'payment'
  const raw=Number(payload.amount)*100
  if(Math.abs(raw-Math.round(raw))>0.000001)return 'amount'
  const remaining=Math.round((record.paidAmount!-record.refundedAmount!)*100),amount=Math.round(raw)
  if(!Number.isFinite(amount)||amount<=0||remaining<=0||amount>remaining||action==='refund-full'&&amount!==remaining||action==='refund-partial'&&amount>=remaining)return 'amount'
 }
 return ''
}
export function addAdminRequest(state:AdminWorkspaceState,request:AdminRequest){return {...state,requests:[...state.requests,{...request,payload:structuredClone(request.payload),status:'prepared' as const}]}}
export function cancelAdminRequest(state:AdminWorkspaceState,id:string){return {...state,requests:state.requests.map(r=>r.id===id?{...r,status:'cancelled' as const}:r)}}
export function configError(kind:string,v:AdminDraft){
 const num=(key:string,min=0,max=Number.MAX_SAFE_INTEGER)=>v[key]!==''&&Number.isFinite(Number(v[key]))&&Number(v[key])>=min&&Number(v[key])<=max
 const ints=(keys:string[])=>keys.every(k=>num(k)&&Number.isInteger(Number(v[k])))
 if(kind.startsWith('plan:')&&(!String(v.name||'').trim()||!['price','priceYear'].every(k=>num(k))||!num('fee',0,100)||!ints(['bookings','aiLimit','automations','seats'])||Number(v.seats)<1))return 'plan'
 if(kind==='payout'||kind.startsWith('override:')){if(!num('fee',0,100)||!num('minPayout')||kind==='payout'&&(!num('promoFee',0,100)||v.promo&&(!String(v.title||'').trim()||!v.from||!v.to||String(v.to)<String(v.from))))return 'payout'}
 if(kind==='financial'&&(!ints(['refund','hold','minw'])||!v.period))return 'financial'
 if(kind==='referral'&&(!num('reward')||v.model==='pct'&&!num('reward',0,100)||!num('inviteeVal')||v.invitee==='discount'&&!num('inviteeVal',0,100)||!ints(['hold','limit'])))return 'referral'
 if(kind.startsWith('template:')&&(!String(v.body||'').trim()||!v.channel||Array.from(String(v.body).matchAll(/\{([^{}]+)\}/g)).some(m=>!['имя','астролог','дата','время','name','practitioner','date','time'].includes(m[1]))))return 'template'
 if(kind==='specializations'&&!String(v.values||'').trim())return 'required'
 if(kind==='legal'&&Object.values(v).some(x=>x&&!safeAdminUrl(String(x))))return 'url'
 return ''
}
export function planEconomics(plan:AdminDraft,average:number,sales:number,baseFee?:number){const revenue=average*sales,commission=revenue*Number(plan.fee||0)/100,platform=commission+Number(plan.price||0),saving=baseFee===undefined?null:average*Math.max(0,baseFee-Number(plan.fee))/100;return {revenue,commission,platform,practitioner:revenue-platform,effective:revenue?platform/revenue*100:0,annualSaving:Number(plan.price)>0&&Number(plan.priceYear)>0?(1-Number(plan.priceYear)/(12*Number(plan.price)))*100:null,breakEven:saving&&saving>0?Math.ceil(Number(plan.price)/saving):null}}

export type AdminPayoutPreview={fee:number|null;source:'base'|'personal'|'promo'|'personal+promo'|'unknown';instant:boolean|null;minimum:number|null;promoState:'off'|'active'|'upcoming'|'expired'|'invalid';promoApplied:boolean;baseFee:number|null;personalFee:number|null;promoFee:number|null}
/** Mirrors original effectivePayout: personal replaces base; promo wins only if no more expensive.
 * Unlike the old renderer, the configured promotion interval is respected. No default fee is invented. */
export function effectiveAdminPayout(base?:AdminDraft,override?:AdminDraft,onDate=new Date().toISOString().slice(0,10)):AdminPayoutPreview{
 const number=(value:unknown,max=Number.MAX_SAFE_INTEGER)=>value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=max?Number(value):null
 const baseFee=number(base?.fee,100),personalOn=!!override&&override.enabled!==false,personalFee=personalOn?number(override?.fee,100):null,promoFee=number(base?.promoFee,100)
 const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value
 let promoState:AdminPayoutPreview['promoState']='off'
 if(base?.promo){const from=String(base.from||''),to=String(base.to||'');promoState=!validDate(onDate)||(from&&!validDate(from))||(to&&!validDate(to))||(from&&to&&from>to)||promoFee===null?'invalid':from&&onDate<from?'upcoming':to&&onDate>to?'expired':'active'}
 let fee=personalOn?personalFee:baseFee,source:AdminPayoutPreview['source']=fee===null?'unknown':personalOn?'personal':'base',instant=typeof (personalOn?override?.instant:base?.instant)==='boolean'?Boolean(personalOn?override?.instant:base?.instant):null
 const minimum=number(personalOn?override?.minPayout:base?.minPayout)
 const promoApplied=promoState==='active'&&promoFee!==null&&fee!==null&&promoFee<=fee
 if(promoApplied){fee=promoFee;source=personalOn?'personal+promo':'promo';instant=instant===true||base?.promoInstant===true?true:instant===false&&base?.promoInstant===false?false:null}
 return {fee,source,instant,minimum,promoState,promoApplied,baseFee,personalFee,promoFee}
}
export type AdminDisputeParty={id:string;name:string;email?:string}
export function disputeMessageRecipient(record:AdminRecord,payload:Record<string,unknown>){
 if(record.kind!=='dispute')return null
 const party=payload.recipientSide==='client'?record.client:payload.recipientSide==='practitioner'?record.practitioner:undefined
 return party?.id&&party.name&&party.id===payload.recipientId?{...party,side:payload.recipientSide as 'client'|'practitioner'}:null
}
