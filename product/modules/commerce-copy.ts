import {tr} from '../i18n'
import {countLabel,money} from './ModuleKit'
import {normalizeCommerce,type CommerceConfig} from '../state/commerce-model'
export const sessionCount=(count:number)=>countLabel(count,[tr('встреча','session'),tr('встречи','sessions'),tr('встреч','sessions')])
export const requestCountLabel=(count:number)=>countLabel(count,[tr('заявка','request'),tr('заявки','requests'),tr('заявок','requests')])
/** Package price is the total; duration applies to each session, never to the package. */
export function serviceSummary(service:{price:number;duration:number;commerce?:CommerceConfig}):string{
 const c=normalizeCommerce(service.commerce,service.price)
 if(c.sale==='pack')return `${sessionCount(c.packCount)}${c.timing==='live'?tr(` по ${service.duration} мин`,` × ${service.duration} min`):''} · ${money(service.price)}`
 if(c.sale==='subscription')return `${tr('Подписка','Subscription')} · ${money(service.price)} / ${c.period==='week'?tr('неделю','week'):c.period==='year'?tr('год','year'):tr('месяц','month')}`
 const timing=c.timing==='live'?`${service.duration} ${tr('мин','min')}`:c.timing==='async'?tr(`Подготовка: ${c.deadlineDays} дн.`,`Preparation: ${c.deadlineDays} days`):tr('Материалы','Materials')
 return `${timing} · ${c.sale==='free'?tr('Бесплатно','Free'):money(service.price)}`
}
