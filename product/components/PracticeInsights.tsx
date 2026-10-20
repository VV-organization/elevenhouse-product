import {useState} from 'react'
import {tr,localeTag} from '../i18n'
import {formatDate,type Practice} from '../state/model'
import {money,countLabel} from '../modules/ModuleKit'
import type {Payment} from '../modules/ServicesFinance'
import {serviceIncomeSummary} from '../modules/service-income-model'
import {clientStages} from './ClientCRM'
import {clientStageSummary} from './practice-insights-model'
import {Icon} from './Icon'
import {Dialog} from './Dialog'
import {ClientStageDistribution} from './ClientStageDistribution'
import './practice-insights.css'

function insightHref(page:string,params:Record<string,string>={}){
 const url=new URL(window.location.href)
 url.hash=page
 Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value))
 return url.toString()
}

/** References: original Analytics → revenue ranking / client segments, CRM → stage filters. */
export function PracticeInsights({practice,payments,from,to}:{practice:Practice;payments:Payment[];from:string;to:string}){
 const [serviceId,setServiceId]=useState<string|null>(null)
 const services=serviceIncomeSummary(payments),peak=Math.max(1,...services.map(s=>s.amount))
 const stages=clientStageSummary(practice,[['',tr('Без этапа','No stage')],...clientStages()]).filter(s=>s.count>0)
 const active=services.find(s=>s.id===serviceId)
 const period=new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).formatRange(new Date(from+'T12:00:00Z'),new Date(to+'T12:00:00Z'))
 return <div className="pi-grid">
  <section className="pi-panel" aria-labelledby="pi-services-title">
   <header><h2 id="pi-services-title">{tr('Доход по услугам','Income by service')}</h2><a href="#analytics">{tr('Подробнее','Details')}<Icon name="arrow" size={16}/></a></header>
   <p className="pi-period">{period} · {tr('после комиссии','after fees')}</p>
   {services.length?<ol className="pi-ranking">{services.slice(0,4).map(s=><li key={s.id}><button onClick={()=>setServiceId(s.id)} aria-haspopup="dialog" aria-label={`${s.name}: ${money(s.amount)}. ${tr('Показать оплаты','Show payments')}`}>
    <span className="pi-rank-title"><strong>{s.name}</strong><b>{money(s.amount)}</b></span>
    <span className="pi-bar" aria-hidden="true"><i style={{width:`${Math.max(0,s.amount)/peak*100}%`}}/></span>
    <span className="pi-rank-detail"><span>{countLabel(s.count,[tr('оплата','payment'),tr('оплаты','payments'),tr('оплат','payments')])}</span><span>{s.share===null?'—':`${s.share.toLocaleString(localeTag(),{maximumFractionDigits:1})}%`} {tr('дохода','of income')}</span></span>
   </button></li>)}</ol>:<p className="pi-empty">{tr('За этот месяц оплаченных услуг пока нет.','No paid services this month yet.')}</p>}
   {services.length>4&&<p className="pi-footnote">{tr('Остальные услуги — в аналитике','More services in analytics')} · {services.length-4}</p>}
  </section>
  <section className="pi-panel" aria-labelledby="pi-clients-title">
   <header><h2 id="pi-clients-title">{tr('Клиенты по этапам','Clients by stage')}</h2><a href={insightHref('clients',{clientStage:'all'})}>{tr('Все клиенты','All clients')}<Icon name="arrow" size={16}/></a></header>
   <p className="pi-period">{tr('Текущая база','Current client base')}</p>
   <ClientStageDistribution stages={stages.map(s=>({...s,href:insightHref('clients',{clientStage:s.id})}))}/>
  </section>
  {active&&<Dialog placement="drawer" title={active.name} onClose={()=>setServiceId(null)}><div className="ep-dialog-body pi-payment-details">
   <p className="pi-period">{period}</p><div className="pi-service-total"><span>{tr('Доход после комиссии','Income after fees')}</span><strong>{money(active.amount)}</strong></div>
   <h3>{tr('Оплаты услуги','Service payments')}</h3>
   <ul>{payments.filter(p=>p.status==='paid'&&p.serviceId===serviceId).sort((a,b)=>(b.receivedDate??b.date).localeCompare(a.receivedDate??a.date)).map(p=><li key={p.id}><a href={insightHref('finance',{paymentId:p.id})}><span><strong>{practice.clients.find(c=>c.id===p.clientId)?.name??tr('Клиент удалён','Client deleted')}</strong><small>{formatDate(p.receivedDate??p.date)}</small></span><b>{money(p.amount-p.commission)}</b><Icon name="arrow" size={16}/></a></li>)}</ul>
  </div></Dialog>}
 </div>
}
