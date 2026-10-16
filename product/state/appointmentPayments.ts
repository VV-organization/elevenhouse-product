import type {Appointment} from './model'
import type {Payment} from '../modules/ServicesFinance'

const priced=(appointment:Appointment)=>typeof appointment.price==='number'&&Number.isFinite(appointment.price)&&appointment.price>0

/** Exact IDs preserve the money history when a consultation moves or changes. */
export function synchronizeAppointmentPayments(payments:Payment[],appointments:Appointment[],today:string,knownPayments:Payment[]=[]):Payment[]{
 let changed=false
 const next=payments.map(payment=>{
  let current=payment
  if(!payment.appointmentId){
   const seed=knownPayments.find(p=>p.id===payment.id&&p.clientId===payment.clientId&&p.serviceId===payment.serviceId&&p.serviceName===payment.serviceName&&p.date===payment.date&&p.amount===payment.amount)
   if(seed?.appointmentId&&appointments.some(a=>a.id===seed.appointmentId&&a.clientId===payment.clientId))current={...payment,appointmentId:seed.appointmentId}
  }
  const appointment=appointments.find(a=>a.id===current.appointmentId&&a.clientId===current.clientId)
  if(current.source==='appointment'&&current.status==='pending'&&appointment&&appointment.status!=='cancelled'&&priced(appointment)){
   const serviceId=appointment.serviceId||'',amount=appointment.price!
   if(current.serviceName!==appointment.title||current.serviceId!==serviceId||current.amount!==amount)current={...current,serviceName:appointment.title,serviceId,amount}
  }
  if(current!==payment)changed=true
  return current
 })
 for(const appointment of appointments){
  if(appointment.status==='cancelled'||!priced(appointment)||next.some(p=>p.appointmentId===appointment.id&&p.clientId===appointment.clientId))continue
  next.push({id:`meeting-${appointment.id}`,appointmentId:appointment.id,source:'appointment',clientId:appointment.clientId,serviceId:appointment.serviceId||'',serviceName:appointment.title,date:today,amount:appointment.price!,commission:0,status:'pending'})
  changed=true
 }
 return changed?next:payments
}

/** Cancellation removes an unpaid request, never received money or refund history. */
export function visibleAppointmentPayment(payment:Payment,appointments:Appointment[]):boolean{
 if(payment.status!=='pending')return true
 const appointment=appointments.find(a=>a.id===payment.appointmentId&&a.clientId===payment.clientId)
 if(appointment?.status==='cancelled')return false
 if(payment.source==='appointment'&&(!appointment||!priced(appointment)))return false
 return true
}
