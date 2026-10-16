export type SubscriptionAction='pause'|'resume'|'cancel'|'change-plan'|'enable-renewal'|'disable-renewal'
export type PortalBillingPlan={id:string;title:string;amount:number;period:'week'|'month'|'year'}
export type PortalSubscription={id:string;serviceId?:string;title:string;amount:number;period:'week'|'month'|'year';status:'active'|'paused'|'cancelled';autoRenew?:boolean;renewsAt?:string;plans?:PortalBillingPlan[]}
export type SubscriptionChange={id:string;subscriptionId:string;action:SubscriptionAction;currentTerms?:Pick<PortalSubscription,'amount'|'period'|'status'|'autoRenew'|'renewsAt'>;plan?:PortalBillingPlan;createdAt:string;status:'prepared'|'cancelled'}
export type SubscriptionChangeResult={requestId:string;subscriptionId:string;status:'applied'|'failed';message?:string;at:string}
export type PortalBillingData={clientId:string;specialistId:string;subscriptions:PortalSubscription[];paymentMethod?:{label:string;last4?:string;manageUrl?:string};receipts?:{paymentId:string;url:string}[];results?:SubscriptionChangeResult[]}
export function billingData(data:PortalBillingData|undefined,clientId:string|undefined,specialistId:string){return clientId&&data?.clientId===clientId&&data.specialistId===specialistId?data:undefined}
export function subscriptionResult(request:SubscriptionChange,results:SubscriptionChangeResult[]=[]){return request.status==='prepared'?[...results].filter(r=>r.requestId===request.id&&r.subscriptionId===request.subscriptionId).sort((a,b)=>b.at.localeCompare(a.at))[0]:undefined}
export function subscriptionActions(sub:PortalSubscription):SubscriptionAction[]{return sub.status==='cancelled'?[]:[sub.status==='active'?'pause':'resume','cancel',...(sub.plans?.length?['change-plan' as const]:[]),...(sub.autoRenew===true?['disable-renewal' as const]:sub.autoRenew===false?['enable-renewal' as const]:[])]}
export function prepareSubscriptionChange(sub:PortalSubscription,action:SubscriptionAction,planId:string|undefined,existing:SubscriptionChange[],id:string,createdAt:string,results:SubscriptionChangeResult[]=[]):SubscriptionChange{
 if(!subscriptionActions(sub).includes(action))throw new Error('state')
 if(existing.some(r=>r.subscriptionId===sub.id&&r.status==='prepared'&&!subscriptionResult(r,results)))throw new Error('pending')
 const plan=action==='change-plan'?sub.plans?.find(p=>p.id===planId):undefined
 if(action==='change-plan'&&(!plan||!Number.isFinite(plan.amount)||plan.amount<0))throw new Error('plan')
 return {id,subscriptionId:sub.id,action,currentTerms:{amount:sub.amount,period:sub.period,status:sub.status,autoRenew:sub.autoRenew,renewsAt:sub.renewsAt},...(plan?{plan:{...plan}}:{}),createdAt,status:'prepared'}
}
