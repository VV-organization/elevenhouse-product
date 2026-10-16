import {useContext} from 'react'
import {tr,localeTag} from '../i18n'
import {TODAY,formatDate,type Practice} from '../state/model'
import type {ProductData} from '../state/product-data'
import {ModuleScopeContext,useModuleState,money,Notice} from '../modules/ModuleKit'
import {initialPayments,paymentDate,paymentTotals,type Payment} from '../modules/ServicesFinance'
import {unknownWallet,type WalletSnapshot} from '../modules/commerce-ledger-model'
import type {PortalOrder} from '../modules/portal-order-model'
import type {ClientCase} from '../modules/portal-case-model'
import {reviewAverage,type ReviewRecord} from '../state/communication-workflows'
import {synchronizeAppointmentPayments,visibleAppointmentPayment} from '../state/appointmentPayments'
import {MEMBER_SCOPE} from '../state/memberAccount'
import {memberPayments} from '../state/memberCore'
import {TodayWorkbench} from './TodayWorkbench'
import {TodayAgenda} from './TodayAgenda'
import {PracticeTasks} from './PracticeTasks'
import {Icon} from './Icon'
import './practice-dashboard.css'

function dashboardHref(page:string,params:Record<string,string>={}){const url=new URL(window.location.href);url.hash=page;Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value));return url.toString()}

type Props={practice:Practice;data?:ProductData;onClient:(id:string)=>void;onMeeting:(id:string)=>void;onNavigate:(page:string)=>void;onNew:()=>void}
export function PracticeDashboard({practice,data,onClient,onMeeting,onNavigate,onNew}:Props){
 const scope=useContext(ModuleScopeContext)
 const [stored,,paymentsFailed]=useModuleState<Payment[]>('payments',practice.isExample,()=>practice.isExample?initialPayments():[])
 const [wallet,,walletFailed]=useModuleState<WalletSnapshot>('wallet-snapshot',practice.isExample,unknownWallet)
 const [reviews,,reviewsFailed]=useModuleState<ReviewRecord[]>('reviews',practice.isExample,()=>[])
 const [orders]=useModuleState<PortalOrder[]>('client-orders',practice.isExample,()=>[])
 const [cases]=useModuleState<ClientCase[]>('client-cases',practice.isExample,()=>[])
 const payments=synchronizeAppointmentPayments(stored,practice.appointments,TODAY,scope===MEMBER_SCOPE?memberPayments:[]).filter(p=>visibleAppointmentPayment(p,practice.appointments))
 const month=TODAY.slice(0,7),paid=payments.filter(p=>paymentDate(p).startsWith(month)&&paymentDate(p)<=TODAY)
 const totals=paymentTotals(paid),average=reviewAverage(reviews)
 const completed=practice.appointments.filter(a=>a.status==='completed'&&a.date.startsWith(month)&&a.date<=TODAY).length
 const ratingCount=reviews.filter(r=>r.status==='published'&&typeof r.rating==='number'&&r.rating>=1&&r.rating<=5).length
 const requests=orders.filter(o=>o.status==='requested'||o.status==='cancellation-requested')
 const disputes=cases.filter(c=>c.status==='prepared'||c.status==='reviewing')
 const agenda=practice.appointments.filter(a=>a.date===TODAY).sort((a,b)=>a.time.localeCompare(b.time))
 const monthLabel=new Intl.DateTimeFormat(localeTag(),{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(TODAY+'T12:00:00Z'))
 const activity=[...payments.filter(p=>p.status!=='pending').map(p=>({id:'payment-'+p.id,date:paymentDate(p),title:(practice.clients.find(c=>c.id===p.clientId)?.name||tr('Клиент','Client'))+' · '+money(p.amount),detail:p.status==='paid'?tr('Оплата отмечена','Payment recorded'):tr('Возврат отмечен','Refund recorded'),page:'finance'})),...orders.map(o=>({id:'order-'+o.id,date:o.reviewedAt||o.createdAt,title:o.title,detail:tr('Заявка клиента','Client request'),page:'services'}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
 return <div className="pd-dashboard">
  <div className="ep-page-heading"><div><p className="ep-eyebrow">{tr('Дашборд','Dashboard')}</p><h1>{tr('Обзор практики','Practice overview')}</h1></div><button className="ep-button ep-button--primary" onClick={onNew}><Icon name="plus"/>{tr('Записать на встречу','Book an appointment')}</button></div>
  <nav className="pd-shortcuts" aria-label={tr('Быстрые действия','Quick actions')}><a href="#today">{tr('Мой рабочий день','My working day')}<Icon name="arrow" size={16}/></a><a href="#tools">{tr('Рассчитать карту','Calculate a chart')}</a><a href="#services">{tr('Продукты и услуги','Products and services')}</a><a href="#content">{tr('Контент и публикации','Content and posts')}</a><a href="#finance">{tr('Оплаты и выплаты','Payments and payouts')}</a></nav>
  <section aria-labelledby="dashboard-month"><div className="ep-section-heading"><h2 id="dashboard-month">{monthLabel}</h2><a href="#analytics">{tr('Вся аналитика','All analytics')}<Icon name="arrow" size={16}/></a></div>
   {(paymentsFailed||walletFailed||reviewsFailed)&&<Notice error>{tr('Не удалось сохранить часть данных обзора. Проверьте соответствующий раздел.','Some overview data could not be saved. Check the relevant section.')}</Notice>}
   <div className="pd-metrics">
    <a href="#analytics"><span>{tr('Доход за месяц','Monthly income')}</span><strong>{money(totals.gross)}</strong><small>{tr('После комиссии: ','After fees: ')}{money(totals.net)}</small></a>
    <a href={dashboardHref('finance',{financeView:'wallet'})}><span>{tr('К выводу','Available to withdraw')}</span><strong>{wallet.available===null?'—':money(wallet.available)}</strong><small>{wallet.available===null?tr('Баланс ещё не получен','Balance not received yet'):tr('Кошелёк и выплаты','Wallet and payouts')}</small></a>
    <a href="#analytics"><span>{tr('Проведено консультаций','Consultations completed')}</span><strong>{completed}</strong><small>{tr('За выбранный месяц','For this month')}</small></a>
    <a href="#reviews"><span>{tr('Рейтинг','Rating')}</span><strong>{average===null?'—':average.toLocaleString(localeTag(),{maximumFractionDigits:1})+' / 5'}</strong><small>{ratingCount?`${ratingCount} ${tr('опубликованных оценок','published ratings')}`:tr('Пока нет опубликованных оценок','No published ratings yet')}</small></a>
   </div>
  </section>
  {(requests.length>0||disputes.length>0)&&<section className="pd-attention" aria-label={tr('Решения по заявкам','Request decisions')}>{requests.length>0&&<a href={dashboardHref('services',{requests:'all'})}><strong>{tr('Заявки клиентов','Client requests')} · {requests.length}</strong><span>{tr('Рассмотреть заявки','Review requests')}<Icon name="arrow" size={16}/></span></a>}{disputes.length>0&&<a href={dashboardHref('finance',{financeView:'refunds'})}><strong>{tr('Споры и возвраты','Disputes and refunds')} · {disputes.length}</strong><span>{tr('Ответить клиентам','Reply to clients')}<Icon name="arrow" size={16}/></span></a>}</section>}
  <TodayWorkbench practice={practice} data={data?.today} onClient={onClient} onMeeting={onMeeting} onNavigate={onNavigate}><div className="pd-working-day"><TodayAgenda practice={practice} items={agenda} onMeeting={onMeeting} onClient={onClient} onNew={onNew}/><aside><PracticeTasks practice={practice} onMeeting={onMeeting} onMessages={()=>{window.location.href=dashboardHref('messages',{filter:'reply'})}} onReminders={()=>{window.location.href=dashboardHref('astro-calendar',{reminders:'active'})}}/><a className="pd-workflow-link" href="#automations"><Icon name="flow"/><span>{tr('Воронки и задачи автоматизации','Funnels and automation tasks')}</span><Icon name="arrow" size={16}/></a></aside></div></TodayWorkbench>
  <section className="pd-activity"><div className="ep-section-heading"><h2>{tr('Последние операции и заявки','Recent transactions and requests')}</h2><a href={dashboardHref('finance',{financeView:'ledger'})}>{tr('Все операции','All transactions')}<Icon name="arrow" size={16}/></a></div>{activity.length?<ul>{activity.map(event=><li key={event.id}><a href={'#'+event.page}><div><strong>{event.title}</strong><span>{event.detail}</span></div><time>{formatDate(event.date.slice(0,10))}</time><Icon name="arrow" size={16}/></a></li>)}</ul>:<p className="ep-muted">{tr('Здесь появятся оплаты и заявки клиентов.','Client payments and requests will appear here.')}</p>}</section>
 </div>
}
