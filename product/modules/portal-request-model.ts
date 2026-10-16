import {addAppointment,setAppointmentStatus,type Practice} from '../state/model'
import {zonedTimestamp} from './portal-slots'
import {tr} from '../i18n'
import type {PortalOrder} from './portal-order-model'
export function acceptPortalRequest(order:PortalOrder,practice:Practice,now=new Date()):{order:PortalOrder;practice:Practice}{
 if(order.status!=='requested')throw new Error(tr('Заявка уже рассмотрена. Обновите список.','This request has already been reviewed. Refresh the list.'))
 if(!order.clientId||!practice.clients.some(c=>c.id===order.clientId))throw new Error(tr('Клиент не связан с вашей практикой. Сначала уточните его данные.','This client is not linked to your practice. Check their details first.'))
 let next=practice
 if(order.appointment){
  if(!['once','pack'].includes(order.commerce.sale)||order.commerce.timing!=='live'||order.commerce.audience!=='solo')throw new Error(tr('Для этого типа услуги нельзя создать одиночную встречу.','This service type cannot create a single appointment.'))
  const timestamp=zonedTimestamp(order.appointment.date,order.appointment.time,order.appointment.timeZone)
  if(!Number.isFinite(timestamp)||timestamp<now.getTime())throw new Error(tr('Время встречи уже прошло. Согласуйте новую запись.','This appointment time has passed. Arrange a new booking.'))
  if(practice.appointments.some(a=>a.id===order.appointment!.id))throw new Error(tr('Эта запись уже существует. Проверьте календарь.','This booking already exists. Check the calendar.'))
  next=addAppointment(practice,{clientId:order.clientId,serviceId:order.serviceId,title:order.title,price:order.total,date:order.appointment.date,time:order.appointment.time,duration:order.appointment.duration})
  const generated=next.appointments.at(-1)!.id
  next={...next,appointments:next.appointments.map(a=>a.id===generated?{...a,id:order.appointment!.id}:a)}
 }
 return {order:{...order,status:'accepted',reviewedAt:new Date().toISOString(),preparation:'not-started'},practice:next}
}
export function rejectPortalRequest(order:PortalOrder,reason:string):PortalOrder{
 if(order.status!=='requested')throw new Error(tr('Заявка уже рассмотрена.','This request has already been reviewed.'))
 if(!reason.trim())throw new Error(tr('Укажите причину для клиента.','Enter a reason for the client.'))
 return {...order,status:'rejected',decisionNote:reason.trim(),reviewedAt:new Date().toISOString()}
}
export function cancelAcceptedRequest(order:PortalOrder,practice:Practice):{order:PortalOrder;practice:Practice}{
 if(order.status!=='cancellation-requested')throw new Error(tr('Нет запроса на отмену.','No cancellation has been requested.'))
 const next=order.appointment&&practice.appointments.some(a=>a.id===order.appointment!.id)?setAppointmentStatus(practice,order.appointment.id,'cancelled'):practice
 return {order:{...order,status:'cancelled',reviewedAt:new Date().toISOString()},practice:next}
}
