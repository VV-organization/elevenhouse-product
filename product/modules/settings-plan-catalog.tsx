import {factoryAdminPlans} from '../state/admin-plan-reset'
import type {SettingsServerData} from '../state/settings-capabilities'
import {tr} from '../i18n'
import {money} from './ModuleKit'
import {planFeatures} from './admin-config'

type Billing=NonNullable<SettingsServerData['billing']>
export function SettingsPlanCatalog({billing,cycle,onRequest}:{billing?:Billing;cycle:'month'|'year';onRequest:(id:string,payload:Record<string,unknown>)=>void}){
 const plans=billing?.plans??Object.values(factoryAdminPlans()).map(plan=>({id:String(plan.id),name:plan.id==='start'?tr('Старт','Start'):String(plan.name),monthly:Number(plan.price),annual:Number(plan.priceYear),fee:Number(plan.fee),features:(plan.features as string[]).map(id=>{const label=planFeatures.find(row=>row[0]===id);return label?tr(label[1],label[2]):id})}))
 return <>{!billing&&<p className="ep-muted">{tr('Исходные условия тарифов. Можно подготовить выбор; действующий тариф, доступ и списания изменятся только после подтверждения сервиса.','Original plan terms. You can prepare a selection; your active plan, access and charges change only after service confirmation.')}</p>}{plans.length?<div className="settings-capabilities-plans">{plans.map(plan=><section key={plan.id}><h3>{plan.name}</h3><strong>{money(cycle==='month'?plan.monthly:plan.annual)} / {cycle==='month'?tr('мес.','month'):tr('год','year')}</strong><p>{tr('Комиссия: ','Fee: ')}{plan.fee}%</p><details><summary>{tr('Возможности тарифа','Included capabilities')} · {plan.features.length}</summary><ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul></details><button className="ep-button" disabled={billing?.currentPlanId===plan.id&&billing?.cycle===cycle} onClick={()=>onRequest(plan.id,{name:plan.name,cycle,amount:cycle==='month'?plan.monthly:plan.annual,fee:plan.fee,termsSource:billing?'service':'original-catalog'})}>{billing?.currentPlanId===plan.id&&billing?.cycle===cycle?tr('Текущий тариф','Current plan'):tr('Подготовить переход','Prepare plan change')}</button></section>)}</div>:<p className="ep-muted">{tr('Сервис не предоставил доступных тарифов.','The service has not provided any available plans.')}</p>}</>
}
