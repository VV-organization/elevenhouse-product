import {useContext,useState} from 'react'
import {PracticeWelcome} from './PracticeWelcome'
import {IncomeTrend} from './IncomeTrend'
import {PracticeInsights} from './PracticeInsights'
import {monthlyIncomeComparison} from './practice-insights-model'
import {tr,localeTag} from '../i18n'
import {TODAY,type Practice} from '../state/model'
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
import './dashboard-light-material.css'
import {ConsultationActivity} from './ConsultationActivity'
import {DayRhythm} from './DayRhythm'
import {FirstPracticeStep} from './FirstPracticeStep'

function dashboardHref(page:string,params:Record<string,string>={}){const url=new URL(window.location.href);url.hash=page;Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value));return url.toString()}

type Props={practice:Practice;data?:ProductData;onClient:(id:string)=>void;onMeeting:(id:string)=>void;onNavigate:(page:string)=>void;onNew:()=>void}
export function PracticeDashboard({practice,onNew,onMeeting,onNavigate}:Props){
 const scope=useContext(ModuleScopeContext)
 const [stored,,paymentsFailed]=useModuleState<Payment[]>('payments',practice.isExample,()=>practice.isExample?initialPayments():[])
 const [wallet,,walletFailed]=useModuleState<WalletSnapshot>('wallet-snapshot',practice.isExample,unknownWallet)
 const [reviews,,reviewsFailed]=useModuleState<ReviewRecord[]>('reviews',practice.isExample,()=>[])
 const [orders]=useModuleState<PortalOrder[]>('client-orders',practice.isExample,()=>[])
 const [cases]=useModuleState<ClientCase[]>('client-cases',practice.isExample,()=>[])
 const payments=synchronizeAppointmentPayments(stored,practice.appointments,TODAY,scope===MEMBER_SCOPE?memberPayments:[]).filter(p=>visibleAppointmentPayment(p,practice.appointments))
 const month=TODAY.slice(0,7),paid=payments.filter(p=>paymentDate(p).startsWith(month)&&paymentDate(p)<=TODAY)
 const totals=paymentTotals(paid),average=reviewAverage(reviews)
 const income=monthlyIncomeComparison(payments,TODAY),[compare,setCompare]=useState(true)
 const periodLabel=(from:string,to:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).formatRange(new Date(from+'T12:00:00Z'),new Date(to+'T12:00:00Z'))
 const priorPeriod=periodLabel(income.previousFrom,income.previousTo)
 const completed=practice.appointments.filter(a=>a.status==='completed'&&a.date.startsWith(month)&&a.date<=TODAY).length
 const ratingCount=reviews.filter(r=>r.status==='published'&&typeof r.rating==='number'&&r.rating>=1&&r.rating<=5).length
 const requests=orders.filter(o=>o.status==='requested'||o.status==='cancellation-requested')
 const disputes=cases.filter(c=>c.status==='prepared'||c.status==='reviewing')
 const agenda=practice.appointments.filter(a=>a.date===TODAY&&a.status!=='cancelled').sort((a,b)=>a.time.localeCompare(b.time))
 const activity=[...payments.filter(p=>p.status!=='pending').map(p=>({id:'payment-'+p.id,date:paymentDate(p),amount:money(p.amount),kind:p.status,title:(practice.clients.find(c=>c.id===p.clientId)?.name||tr('Клиент','Client')),detail:p.status==='paid'?tr('Оплата отмечена','Payment recorded'):tr('Возврат отмечен','Refund recorded'),page:'finance'})),...orders.map(o=>({id:'order-'+o.id,date:o.reviewedAt||o.createdAt,amount:'',kind:'request',title:o.title,detail:tr('Заявка клиента','Client request'),page:'services'}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5)
 const appointmentLabel=tr(agenda.length%10===1&&agenda.length%100!==11?'встреча':agenda.length%10>=2&&agenda.length%10<=4&&(agenda.length%100<12||agenda.length%100>14)?'встречи':'встреч',agenda.length===1?'appointment':'appointments')
 const next=agenda.find(a=>a.status==='confirmed')
 if(!practice.clients.length&&!practice.appointments.length&&!payments.length&&!orders.length&&!cases.length&&!reviews.length&&wallet.available===null)return <div className="pd-dashboard"><header className="ep-page-heading"><h1>{tr('Дашборд','Dashboard')}</h1></header><FirstPracticeStep name={practice.profile.name} onBegin={intent=>intent==='calendar'?onNew():onNavigate('tools')}/></div>
 return <div className="pd-dashboard">
  <header className="ep-page-heading"><h1>{tr('Дашборд','Dashboard')}</h1><button className="ep-button ep-button--primary" onClick={onNew}><Icon name="plus"/>{tr('Записать на встречу','Book an appointment')}</button></header>
  {(paymentsFailed||walletFailed||reviewsFailed)&&<Notice error>{tr('Не удалось сохранить часть данных обзора. Проверьте соответствующий раздел.','Some overview data could not be saved. Check the relevant section.')}</Notice>}
  <PracticeWelcome practice={practice}/>
  <div className="pd-summary-grid">
   <section className="pd-balance" aria-label={tr('Доход за месяц','Monthly income')}>
    <a className="pd-income" href="#analytics"><span>{tr('Доход за месяц','Monthly income')}<Icon name="arrow" size={18}/></span><strong>{money(totals.gross)}</strong><small>{tr('После комиссии','After fees')} <b>{money(totals.net)}</b></small><small className="pd-income-change">{income.change===null?tr(`Ранее после комиссии: ${money(income.previousNet)}`,`Previously after fees: ${money(income.previousNet)}`):tr(`${income.change>=0?'+':''}${(income.change*100).toLocaleString(localeTag(),{maximumFractionDigits:1})}% после комиссии`,`${income.change>=0?'+':''}${(income.change*100).toLocaleString(localeTag(),{maximumFractionDigits:1})}% after fees`)}<span>{tr('Сравнение с','Compared with')} {priorPeriod}</span></small></a>
    <a className="pd-wallet" href={dashboardHref('finance',{financeView:'wallet'})}><span>{tr('К выводу','Available to withdraw')}<small>{wallet.available===null?tr('Баланс ещё не получен','Balance not received yet'):tr('Кошелёк и выплаты','Wallet and payouts')}</small></span><strong>{wallet.available===null?'—':money(wallet.available)}</strong><Icon name="arrow" size={16}/></a>
   </section>
   <section className="pd-work-summary" aria-label={tr('Работа с клиентами','Client work')}>
    <a className="pd-today" href="#today"><span>{tr('Сегодня','Today')}<strong>{agenda.length} {appointmentLabel}</strong></span><Icon name="arrow" size={18}/></a>
    {next?<button className="pd-next-meeting" onClick={()=>onMeeting(next.id)}><span className="pd-meeting-time"><time dateTime={`${next.date}T${next.time}`}>{next.time}</time><small>{next.duration} {tr('мин','min')}</small></span><span className="pd-meeting-person"><strong>{practice.clients.find(c=>c.id===next.clientId)?.name||tr('Клиент','Client')}</strong><small>{next.title}</small></span><Icon name="arrow" size={16}/></button>:<p className="pd-empty-day">{tr('Нет запланированных встреч на сегодня','No appointments scheduled today')}</p>}
    <DayRhythm practice={practice} date={TODAY} onOpen={onMeeting}/>
    <a className="pd-client-count" href="#clients"><Icon name="clients" size={18}/><span>{tr('Клиенты','Clients')}</span><strong>{practice.clients.length}</strong><Icon name="arrow" size={16}/></a>
   </section>
   <section className="pd-attention" aria-labelledby="dashboard-attention"><h2 id="dashboard-attention">{tr('Требуют внимания','Needs attention')}<span>{requests.length+disputes.length}</span></h2>
    <div className="pd-decisions">{requests.length>0&&<a href={dashboardHref('services',{requests:'all'})}><span>{tr('Заявки клиентов','Client requests')}<b>{requests.length}</b></span><Icon name="arrow" size={16}/></a>}{disputes.length>0&&<a href={dashboardHref('finance',{financeView:'refunds'})}><span>{tr('Споры и возвраты','Disputes and refunds')}<b>{disputes.length}</b></span><Icon name="arrow" size={16}/></a>}{!requests.length&&!disputes.length&&<p><Icon name="check" size={18}/>{tr('Новых заявок и споров нет','No new requests or disputes')}</p>}</div>
    <div className="pd-small-metrics"><a className="pd-consultation-summary" href="#analytics"><span>{tr('Проведено консультаций','Consultations completed')}<small>{tr('За этот месяц','This month')}</small></span><strong>{completed}</strong><ConsultationActivity appointments={practice.appointments} today={TODAY}/></a><a href="#reviews"><span>{tr('Рейтинг','Rating')}<small>{ratingCount?`${ratingCount} ${tr('опубликованных оценок','published ratings')}`:tr('Пока нет оценок','No ratings yet')}</small></span><strong>{average===null?'—':average.toLocaleString(localeTag(),{maximumFractionDigits:1})+' / 5'}</strong></a></div>
   </section>
  </div>
  <div className="pd-details-grid">
   <section className="pd-income-chart"><div className="pd-section-heading"><h2>{tr('Динамика дохода','Income over time')}</h2><a href="#analytics">{tr('Вся аналитика','All analytics')}<Icon name="arrow" size={16}/></a></div><div className="pd-income-comparison"><span>{tr('После комиссии','After fees')} · {periodLabel(income.from,TODAY)}</span><label><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/>{tr('Сравнить с прошлым месяцем','Compare with last month')}</label></div><IncomeTrend points={income.current.map(p=>({date:paymentDate(p),amount:p.amount-p.commission}))} from={income.from} to={income.to} comparison={compare?{from:income.previousFrom,to:income.previousTo,points:income.previous.map(p=>({date:paymentDate(p),amount:p.amount-p.commission}))}:undefined}/></section>
   <section className="pd-activity"><div className="pd-section-heading"><h2>{tr('Операции и заявки','Transactions and requests')}</h2><a href={dashboardHref('finance',{financeView:'ledger'})} aria-label={tr('Все операции','All transactions')}><Icon name="arrow" size={18}/></a></div>{activity.length?<ul>{activity.map(event=><li key={event.id}><a href={'#'+event.page}><span className={`pd-event-mark pd-event-mark--${event.kind}`} aria-hidden="true"><Icon name={event.kind==='request'?'service':event.kind==='paid'?'wallet':'back'} size={17}/></span><div><strong>{event.title}</strong><span>{event.detail}</span></div><div className={`pd-activity-amount pd-activity-amount--${event.kind}`}>{event.amount&&<b>{event.amount}</b>}<time dateTime={event.date.slice(0,10)}>{new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',year:event.date.slice(0,4)!==TODAY.slice(0,4)?'numeric':undefined,timeZone:'UTC'}).format(new Date(event.date.slice(0,10)+'T12:00:00Z'))}</time></div></a></li>)}</ul>:<p className="ep-muted">{tr('Здесь появятся оплаты и заявки клиентов.','Client payments and requests will appear here.')}</p>}</section>
  </div>
  <PracticeInsights practice={practice} payments={income.current} from={income.from} to={income.to}/>
  <nav className="pd-tools" aria-label={tr('Быстрые действия','Quick actions')}><h2>{tr('Инструменты практики','Practice tools')}</h2><div>{[['tools','chart','Рассчитать карту','Calculate a chart'],['services','service','Продукты и услуги','Products and services'],['content','publication','Контент и публикации','Content and posts'],['finance','wallet','Оплаты и выплаты','Payments and payouts'],['automations','flow','Воронки и автоматизация','Funnels and automation']].map(([id,icon,ru,en])=><a key={id} href={'#'+id}><span className="ct-symbol" aria-hidden="true"><Icon name={icon} size={20}/></span><span>{tr(ru,en)}</span><Icon name="arrow" size={16}/></a>)}</div></nav>
 </div>
}
