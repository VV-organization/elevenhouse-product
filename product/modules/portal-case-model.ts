import type {Payment} from './ServicesFinance'
import type {PortalOrder} from './portal-order-model'
import {tr} from '../i18n'
export type ClientCase={id:string;clientId:string;orderId?:string;paymentId?:string;title:string;kind:'dispute'|'refund';reason:string;description:string;amount?:number;createdAt:string;status:'prepared'|'reviewing'|'resolved'|'withdrawn';response?:string}
export const caseReasons=['not-delivered','quality','duplicate','after-cancellation','other'] as const
export function createClientCase(input:Pick<ClientCase,'clientId'|'orderId'|'paymentId'|'kind'|'reason'|'description'|'amount'>,orders:PortalOrder[],payments:Payment[],existing:ClientCase[]):ClientCase{
 const order=orders.find(o=>o.id===input.orderId&&o.clientId===input.clientId),payment=payments.find(p=>p.id===input.paymentId&&p.clientId===input.clientId)
 if(!input.clientId||(!order&&!payment))throw new Error(tr('Выберите свой заказ или оплату.','Choose your order or payment.'))
 if(input.orderId&&!order||input.paymentId&&!payment)throw new Error(tr('Заказ или оплата не найдены.','Order or payment not found.'))
 if(order&&payment&&payment.orderId!==order.id&&(!order.appointment?.id||order.appointment.id!==payment.appointmentId))throw new Error(tr('Эта оплата не связана с заказом.','This payment is not linked to the order.'))
 if(!caseReasons.includes(input.reason as typeof caseReasons[number])||input.description.trim().length<10)throw new Error(tr('Выберите причину и опишите ситуацию минимум в 10 символах.','Choose a reason and describe the issue in at least 10 characters.'))
 if(input.kind==='refund'&&(!payment||payment.status!=='paid'||!Number.isFinite(input.amount)||input.amount!<=0||input.amount!>payment.amount))throw new Error(tr('Возврат можно запросить только по полученной оплате, в пределах её суммы.','A refund can only be requested against a received payment, up to its amount.'))
 if(existing.some(c=>c.clientId===input.clientId&&(c.status==='prepared'||c.status==='reviewing')&&((order&&c.orderId===order.id)||(payment&&c.paymentId===payment.id))))throw new Error(tr('По этому заказу уже есть открытое обращение.','There is already an open case for this order.'))
 return {...input,description:input.description.trim(),id:crypto.randomUUID(),title:order?.title??payment!.serviceName,createdAt:new Date().toISOString(),status:'prepared',amount:input.kind==='refund'?input.amount:undefined}
}
export function reviewClientCase(item:ClientCase,response:string,resolve=false):ClientCase{
 if(item.status==='withdrawn'||item.status==='resolved')throw new Error(tr('Обращение уже закрыто.','This case is already closed.'))
 if(!response.trim())throw new Error(tr('Добавьте ответ клиенту.','Add a response for the client.'))
 return {...item,status:resolve?'resolved':'reviewing',response:response.trim()}
}
