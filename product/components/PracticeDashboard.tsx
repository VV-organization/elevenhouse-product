import {useContext} from 'react'
import {RevenueChart} from './RevenueChart'
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
import {Icon} from './Icon'
import './practice-dashboard.css'

function dashboardHref(page:string,params:Record<string,string>={}){const url=new URL(window.location.href);url.hash=page;Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value));return url.toString()}

type Props={practice:Practice;data?:ProductData;onClient:(id:string)=>void;onMeeting:(id:string)=>void;onNavigate:(page:string)=>void;onNew:()=>void}
export function PracticeDashboard({practice,onNew,onMeeting}:Props){
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
 const activity=[...payments.filter(p=>p.status!=='pending').map(p=>({id:'payment-'+p.id,date:paymentDate(p),amount:money(p.amount),kind:p.status,title:(practice.clients.find(c=>c.id===p.clientId)?.name||tr('Клиент','Client')),detail:p.status==='paid'?tr('Оплата отмечена','Payment recorded'):tr('Возврат отмечен','Refund recorded'),page:'finance'})),...orders.map(o=>({id:'order-'+o.id,date:o.reviewedAt||o.createdAt,amount:'',kind:'request',title:o.title,detail:tr('Заявка клиента','Client request'),page:'services'}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
 const appointmentLabel=tr(agenda.length%10===1&&agenda.length%100!==11?'встреча':agenda.length%10>=2&&agenda.length%10<=4&&(agenda.length%100<12||agenda.length%100>14)?'встречи':'встреч',agenda.length===1?'appointment':'appointments')
 return <div className="pd-dashboard">
  <header className="ep-page-heading"><h1>{tr('Дашборд','Dashboard')}</h1><button className="ep-button ep-button--primary" onClick={onNew}><Icon name="plus"/>{tr('Записать на встречу','Book an appointment')}</button></header>
  {(requests.length>0||disputes.length>0)&&<section className="pd-attention" aria-labelledby="dashboard-attention"><h2 id="dashboard-attention">{tr('Требуют решения','Decisions needed')}</h2><div>{requests.length>0&&<a href={dashboardHref('services',{requests:'all'})}><span><strong>{tr('Заявки клиентов','Client requests')} · {requests.length}</strong><small>{tr('Рассмотреть заявки','Review requests')}</small></span><Icon name="arrow" size={18}/></a>}{disputes.length>0&&<a href={dashboardHref('finance',{financeView:'refunds'})}><span><strong>{tr('Споры и возвраты','Disputes and refunds')} · {disputes.length}</strong><small>{tr('Ответить клиентам','Reply to clients')}</small></span><Icon name="arrow" size={18}/></a>}</div></section>}
  <section className="pd-overview" aria-labelledby="dashboard-month">
   <div className="pd-overview-heading"><h2 id="dashboard-month">{monthLabel}</h2><a href="#analytics">{tr('Вся аналитика','All analytics')}<Icon name="arrow" size={16}/></a></div>
   {(paymentsFailed||walletFailed||reviewsFailed)&&<Notice error>{tr('Не удалось сохранить часть данных обзора. Проверьте соответствующий раздел.','Some overview data could not be saved. Check the relevant section.')}</Notice>}
   <div className="pd-overview-body">
    <div className="pd-financial-summary"><a className="pd-income" href="#analytics"><span>{tr('Доход за месяц','Monthly income')}</span><strong>{money(totals.gross)}</strong><small>{tr('После комиссии: ','After fees: ')}<b>{money(totals.net)}</b></small></a></div>
    <div className="pd-income-chart"><RevenueChart points={paid.filter(p=>p.status==='paid').map(p=>({date:paymentDate(p),amount:p.amount}))} from={month+'-01'} to={TODAY} label={tr('Поступления за месяц','Monthly receipts')}/></div>
    <div className="pd-supporting-metrics"><a className="pd-wallet" href={dashboardHref('finance',{financeView:'wallet'})}><span>{tr('К выводу','Available to withdraw')}<small>{wallet.available===null?tr('Баланс ещё не получен','Balance not received yet'):tr('Кошелёк и выплаты','Wallet and payouts')}</small></span><strong>{wallet.available===null?'—':money(wallet.available)}</strong><Icon name="arrow" size={16}/></a><a href="#analytics"><span>{tr('Проведено консультаций','Consultations completed')}</span><strong>{completed}</strong><small>{tr('За выбранный месяц','For this month')}</small></a><a href="#reviews"><span>{tr('Рейтинг','Rating')}</span><strong>{average===null?'—':average.toLocaleString(localeTag(),{maximumFractionDigits:1})+' / 5'}</strong><small>{ratingCount?`${ratingCount} ${tr('опубликованных оценок','published ratings')}`:tr('Пока нет опубликованных оценок','No published ratings yet')}</small></a></div>
   </div>
  </section>
  <div className="pd-details-grid">
    <section className="pd-work-summary"><h2>{tr('Работа с клиентами','Client work')}</h2><a className="pd-today" href="#today"><span><span>{tr('Сегодня','Today')}</span><strong>{agenda.length} {appointmentLabel}</strong><small>{tr('Мой рабочий день','My working day')}</small></span><Icon name="arrow" size={20}/></a>{agenda.find(a=>a.status==='confirmed')&&(()=>{const next=agenda.find(a=>a.status==='confirmed')!;return <button className="pd-next-meeting" onClick={()=>onMeeting(next.id)}><time>{next.time}</time><span><strong>{practice.clients.find(c=>c.id===next.clientId)?.name||tr('Клиент','Client')}</strong><small>{next.title}</small></span><Icon name="arrow" size={16}/></button>})()}<a className="pd-client-count" href="#clients"><span>{tr('Клиенты','Clients')}</span><strong>{practice.clients.length}</strong><Icon name="arrow" size={16}/></a></section>

   <section className="pd-activity"><div className="pd-activity-heading"><h2>{tr('Последние операции и заявки','Recent transactions and requests')}</h2><a href={dashboardHref('finance',{financeView:'ledger'})}>{tr('Все операции','All transactions')}<Icon name="arrow" size={16}/></a></div>{activity.length?<ul>{activity.map(event=><li key={event.id}><a href={'#'+event.page}><div><strong>{event.title}</strong><span>{event.detail}</span></div><div className={`pd-activity-amount pd-activity-amount--${event.kind}`}>{event.amount&&<b>{event.amount}</b>}<time dateTime={event.date.slice(0,10)}>{formatDate(event.date.slice(0,10))}</time></div><Icon name="arrow" size={16}/></a></li>)}</ul>:<p className="ep-muted">{tr('Здесь появятся оплаты и заявки клиентов.','Client payments and requests will appear here.')}</p>}</section>
    <nav className="pd-tools" aria-label={tr('Быстрые действия','Quick actions')}><h2>{tr('Инструменты практики','Practice tools')}</h2>{[['tools','Рассчитать карту','Calculate a chart'],['services','Продукты и услуги','Products and services'],['content','Контент и публикации','Content and posts'],['finance','Оплаты и выплаты','Payments and payouts'],['automations','Воронки и автоматизация','Funnels and automation']].map(([id,ru,en])=><a key={id} href={'#'+id}><span>{tr(ru,en)}</span><Icon name="arrow" size={16}/></a>)}</nav>
  </div>
 </div>
}
