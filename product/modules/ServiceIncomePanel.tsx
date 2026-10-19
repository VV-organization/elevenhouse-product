import {useState} from 'react'
import {tr,localeTag} from '../i18n'
import {formatDate} from '../state/model'
import {Dialog} from '../components/Dialog'
import {Icon} from '../components/Icon'
import {countLabel,money} from './ModuleKit'
import {serviceIncomeSummary} from './service-income-model'
import type {Payment} from './ServicesFinance'
import './service-income-panel.css'

export function ServiceIncomePanel({payments,periodLabel,clientName,onPayment}:{payments:Payment[];periodLabel:string;clientName:(id:string)=>string;onPayment:(payment:Payment)=>void}){
 const [selected,setSelected]=useState<string|null>(null)
 const rows=serviceIncomeSummary(payments),active=rows.find(row=>row.id===selected)
 const details=payments.filter(p=>p.status==='paid'&&p.serviceId===selected).sort((a,b)=>(b.receivedDate||b.date).localeCompare(a.receivedDate||a.date))
 return <section className="ex-panel av-services si-panel" aria-labelledby="service-income-title">
  <header className="si-heading"><h2 id="service-income-title">{tr('Оплаченные услуги','Paid services')}</h2><a href="#services" aria-label={tr('Открыть каталог услуг','Open service catalog')} title={tr('Каталог услуг','Service catalog')}><Icon name="arrow" size={18}/></a></header>
  {rows.length?<div className="si-list">{rows.map(row=><button className={`si-row${row.leading?' is-leading':''}`} key={row.id} onClick={()=>setSelected(row.id)} aria-haspopup="dialog">
   <span className="si-symbol" aria-hidden="true">{row.name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase(localeTag())}</span>
   <span className="si-name"><strong>{row.name}</strong><span>{countLabel(row.count,[tr('оплаченный заказ','paid order'),tr('оплаченных заказа','paid orders'),tr('оплаченных заказов','paid orders')])}</span>{row.leading&&<small>{tr('Наибольший доход','Highest income')}</small>}</span>
   <span className="si-value"><strong>{money(row.amount)}</strong><span>{row.share===null?'—':`${row.share.toLocaleString(localeTag(),{maximumFractionDigits:1})}%`} {tr('дохода','of income')}</span></span>
  </button>)}</div>:<p className="si-empty">{tr('Пока нет оплаченных заказов за этот период.','No paid orders in this period yet.')}</p>}
  <p className="si-note">{tr('Только оплаченные заказы. Доход после комиссии.','Paid orders only. Income after fees.')}</p>
  {active&&<Dialog placement="drawer" className="si-details-dialog" title={active.name} onClose={()=>setSelected(null)}><div className="ep-dialog-body si-details">
   <p className="si-period">{periodLabel}</p><div className="si-total"><span>{tr('Доход после комиссии','Income after fees')}</span><strong>{money(active.amount)}</strong><span>{countLabel(active.count,[tr('оплаченный заказ','paid order'),tr('оплаченных заказа','paid orders'),tr('оплаченных заказов','paid orders')])}</span></div>
   <h3>{tr('Оплаты этой услуги','Payments for this service')}</h3><div className="si-payments">{details.map(payment=><button key={payment.id} onClick={()=>{setSelected(null);onPayment(payment)}}><span><strong>{clientName(payment.clientId)}</strong><span>{formatDate(payment.receivedDate||payment.date)} · {payment.id}</span></span><span><strong>{money(payment.amount-payment.commission)}</strong><span>{tr('После комиссии','After fees')}</span></span><Icon name="arrow" size={16}/></button>)}</div>
  </div></Dialog>}
 </section>
}
