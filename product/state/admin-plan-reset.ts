import {addAdminRequest,type AdminDraft,type AdminWorkspaceState,type AdminRequest,type AdminRole} from './admin-workflows'
// Original app/plans-data.jsx defaultPlans; these are proposed defaults, never effective server data.
export function factoryAdminPlans():Record<string,AdminDraft>{
 const pro=['engine','pdf','natal','synastry','forecast','solar','matrix','numerology','hd','horar','vedic','astrocal','child','page','products','calendar','crm','funnels','group','ai','aicontent','triggers','content','autopost','journal','video','recordings','inbox','analytics','refs']
 return {
 'plan:start':{id:'start',name:'Старт',nameEn:'Start',tagline:'Чтобы начать практику',taglineEn:'To begin your practice',price:0,priceYear:0,fee:8,bookings:30,seats:1,aiLimit:20,automations:1,color:'#6FA8FF',popular:false,active:true,features:['engine','pdf','natal','numerology','page','calendar','crm','inbox','refs']},
 'plan:pro':{id:'pro',name:'Pro',nameEn:'Pro',tagline:'Для активной практики',taglineEn:'For an active practice',price:1990,priceYear:19100,fee:4,bookings:0,seats:1,aiLimit:0,automations:0,color:'#F4C430',popular:true,active:true,features:[...pro]},
 'plan:studio':{id:'studio',name:'Studio',nameEn:'Studio',tagline:'Команда и масштаб',taglineEn:'Team and scale',price:4990,priceYear:47900,fee:2,bookings:0,seats:5,aiLimit:0,automations:0,color:'#B79CFB',popular:false,active:true,features:[...pro,'team','whitelabel','api','priority']}
 }
}
export const planSet=(configs:Record<string,AdminDraft>)=>Object.fromEntries(Object.entries(configs).filter(([id])=>id.startsWith('plan:')))
export function planResetError(role:AdminRole,reason:string,reviewed:boolean,active:AdminRequest[]){
 if(role!=='admin')return 'permission'
 if(!reason.trim()||!reviewed)return 'review'
 if(active.some(r=>r.status==='prepared'&&r.kind==='config'&&(r.target.startsWith('plan:')||r.target==='plans-reset')))return 'conflict'
 return ''
}
export function preparePlanReset(state:AdminWorkspaceState,confirmed:Record<string,AdminDraft>|undefined,meta:{id:string;actor:string;reason:string;createdAt:string}){
 return addAdminRequest(state,{...meta,target:'plans-reset',kind:'config',status:'prepared',payload:{operation:'reset-plans',targetName:'Стандартные тарифы / Default plans',replacement:factoryAdminPlans(),previousConfirmed:confirmed===undefined?null:planSet(confirmed),previousDrafts:planSet(state.drafts)}})
}
