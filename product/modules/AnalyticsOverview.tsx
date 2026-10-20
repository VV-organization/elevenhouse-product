import {useState,type CSSProperties,type ReactNode} from 'react'
import {tr,localeTag} from '../i18n'
import {IncomeTrend} from '../components/IncomeTrend'
import {ClientStageDistribution} from '../components/ClientStageDistribution'
import {Icon} from '../components/Icon'
import {Dialog} from '../components/Dialog'
import {formatDate} from '../state/model'
import {money,useModuleState} from './ModuleKit'
import {practiceAnalytics,emptyAnalyticsEvidence,type AnalyticsEvidence} from './commerce-analytics-model'
import {detailedAnalytics,goalProgress,type AnalyticsGoal,type AnalyticsExtraEvidence} from './commerce-analytics-detail'
import {serviceIncomeSummary} from './service-income-model'
import type {Payment} from './ServicesFinance'
import type {Practice} from '../state/model'
import './analytics-overview.css'

type Slice={label:string;value:number;color?:number}
const color=(index:number)=>`var(--data-series-${index%5+1})`
const number=(value:number)=>value.toLocaleString(localeTag(),{maximumFractionDigits:1})
const percent=(value:number|null)=>value===null?'—':`${Math.round(value*100)}%`
function Panel({title,note,action,children,className=''}:{title:string;note?:string;action?:ReactNode;children:ReactNode;className?:string}){
 return <section className={`ao-panel ${className}`} aria-label={title}><header><div><h2>{title}</h2>{note&&<p>{note}</p>}</div>{action}</header>{children}</section>
}
export function AnalyticsRing({slices,label}:{slices:Slice[];label:string}){
 const total=slices.reduce((n,s)=>n+s.value,0)
 let offset=0
 return <div className="ao-ring-layout"><div className="ao-ring">
  <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="ao-ring-track" cx="100" cy="100" r="80"/>{slices.map((s,i)=>{const length=total?s.value/total*100:0,start=offset;offset+=length;return length>0?<circle key={s.label} cx="100" cy="100" r="80" pathLength="100" fill="none" stroke={color(s.color??i)} strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start}/>:null})}</svg>
  <div><strong>{number(total)}</strong><span>{label}</span></div>
 </div><ul className="ao-legend">{slices.map((s,i)=><li key={s.label}><i style={{background:color(s.color??i)}}/><span>{s.label}</span><strong>{number(s.value)}</strong><small>{total?percent(s.value/total):'—'}</small></li>)}</ul></div>
}
export function AnalyticsColumns({slices,unit}:{slices:Slice[];unit:string}){
 const peak=slices.reduce((best,s,i)=>s.value>(slices[best]?.value??0)?i:best,0)
 const [selected,setSelected]=useState<number|null>(null),index=selected===null?peak:Math.min(selected,slices.length-1)
 const max=Math.max(1,...slices.map(s=>s.value)),active=slices[index]
 return <figure className="ao-columns"><figcaption aria-live="polite"><span>{active?.label}</span><strong>{number(active?.value??0)} <small>{unit}</small></strong></figcaption>
 <div className="ao-column-plot" style={{'--ao-columns':slices.length} as CSSProperties}>{slices.map((s,i)=><button key={s.label} type="button" aria-label={`${s.label}: ${number(s.value)} ${unit}`} aria-pressed={index===i} tabIndex={index===i?0:-1} onClick={()=>setSelected(i)} onFocus={()=>setSelected(i)} onMouseEnter={()=>setSelected(i)} onKeyDown={event=>{const next=event.key==='ArrowRight'?Math.min(slices.length-1,i+1):event.key==='ArrowLeft'?Math.max(0,i-1):event.key==='Home'?0:event.key==='End'?slices.length-1:-1;if(next>=0){event.preventDefault();(event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus()}}}>
 <span className="ao-column-track" aria-hidden="true"><i style={{height:`${s.value/max*100}%`}}/></span><span>{s.label}</span></button>)}</div></figure>
}
function Ratio({label,value,note,colorIndex=0}:{label:string;value:number|null;note:string;colorIndex?:number}){
 return <div className="ao-ratio"><div><span>{label}</span><strong>{percent(value)}</strong></div>{value===null?<div className="ao-no-value"/>:<meter min={0} max={1} value={Math.max(0,Math.min(1,value))} aria-label={label} style={{'--ao-accent':color(colorIndex)} as CSSProperties}/>}<p>{note}</p></div>
}

export function AnalyticsOverview({payments,practice,range,comparison,onDetails,onPayment,onClient}:{payments:Payment[];practice:Practice;range:{from:string;to:string};comparison?:{from:string;to:string};onDetails:(view:'income'|'practice',scroll?:boolean,tab?:string)=>void;onPayment:(payment:Payment)=>void;onClient:(id:string)=>void}){
 const [selectedService,setSelectedService]=useState<string|null>(null)
 const [evidence]=useModuleState<AnalyticsEvidence>('analytics-evidence',practice.isExample,emptyAnalyticsEvidence)
 const [extra]=useModuleState<AnalyticsExtraEvidence>('analytics-extra-evidence',practice.isExample,()=>({}))
 const [goals]=useModuleState<AnalyticsGoal[]>('analytics-goals',practice.isExample,()=>[])
 const base=practiceAnalytics(payments,practice,range,evidence),detail=detailedAnalytics(payments,practice,range,evidence,extra)
 const prior=comparison?practiceAnalytics(payments,practice,comparison,evidence):null
 const net=base.paid.reduce((n,p)=>n+p.amount-p.commission,0),priorNet=prior?.paid.reduce((n,p)=>n+p.amount-p.commission,0)??0
 const services=serviceIncomeSummary(base.paid),highestService=Math.max(1,...services.map(s=>s.amount))
 const goal=goals.find(g=>g.period==='month'&&g.start===range.to.slice(0,7)+'-01'),progress=goal?goalProgress(goal,payments):null
 const stageNames:Record<string,string>={unknown:tr('Без этапа','No stage'),new:tr('Новый','New'),active:tr('В работе','Active'),paused:tr('Пауза','Paused'),archived:tr('Архив','Archived')}
 const segments=detail.segments.map(s=>{const url=new URL(window.location.href);url.hash='clients';url.searchParams.set('clientStage',s.id==='unknown'?'':s.id);return {id:s.id,label:stageNames[s.id]??s.label,count:s.clients,href:url.toString()}})
 const weekdays=[tr('Пн','Mon'),tr('Вт','Tue'),tr('Ср','Wed'),tr('Чт','Thu'),tr('Пт','Fri'),tr('Сб','Sat'),tr('Вс','Sun')]
 const hours=detail.hours.filter(h=>h.bookedMinutes>0)
 const firstHour=Math.min(8,...hours.map(h=>h.hour)),lastHour=Math.max(19,...hours.map(h=>h.hour))
 const clientRevenue=base.clientIds.map(id=>({id,name:practice.clients.find(c=>c.id===id)?.name??tr('Клиент удалён','Client deleted'),amount:base.paid.filter(p=>p.clientId===id).reduce((n,p)=>n+p.amount-p.commission,0)})).sort((a,b)=>b.amount-a.amount)
 const stageLabels=[tr('Посетители','Visitors'),tr('Оставили заявку','Became a lead'),tr('Начали запись','Started booking'),tr('Оплатили','Paid')]
 const funnel=[base.funnel.visits,base.funnel.leads,base.funnel.bookings,base.funnel.paid]
 const funnelMax=Math.max(1,...funnel.map(v=>v??0))
 const link=(label:string,view:'income'|'practice',scroll=false,tab='goals')=><button className="ep-text-button ao-detail-link" onClick={()=>onDetails(view,scroll,tab)}>{label}<Icon name="arrow" size={16}/></button>
 return <div className="ao-dashboard">
  <div className="ao-summary">
   {[
    [tr('Доход после комиссии','Income after fees'),money(net),comparison?(priorNet?tr(`${net>=priorNet?'+':''}${Math.round((net-priorNet)/priorNet*100)}% к предыдущему периоду`,`${net>=priorNet?'+':''}${Math.round((net-priorNet)/priorNet*100)}% vs previous period`):tr('Ранее поступлений не было','No previous income')):tr(`${base.paid.length} оплаченных заказов`,`${base.paid.length} paid orders`)],
    [tr('Средний оплаченный заказ','Average paid order'),base.averageOrder===null?'—':money(Math.round(base.averageOrder)),tr('До вычета комиссии','Before fees')],
    [tr('Оплатившие клиенты','Paying clients'),number(base.clientIds.length),tr(`${base.returning.length} с повторными оплатами`,`${base.returning.length} with repeat payments`)],
    [tr('Время встреч','Appointment time'),`${number(detail.bookedMinutes/60)} ${tr('ч','h')}`,tr(`${base.appointments.length-base.cancelled} встреч без отмен`,`${base.appointments.length-base.cancelled} appointments, excluding cancellations`)]
   ].map(([label,value,note],i)=><section key={label} className={`ao-kpi${i===0?' ao-kpi--main':''}`}><h2>{label}</h2><strong>{value}</strong><p>{note}</p></section>)}
  </div>
  <div className="ao-grid">
   <Panel title={tr('Динамика дохода','Income over time')} note={tr('После комиссии · по дате получения оплаты','After fees · by receipt date')} className="ao-trend" action={link(tr('Подробно','Details'),'income')}>
    <IncomeTrend points={base.paid.map(p=>({date:p.receivedDate??p.date,amount:p.amount-p.commission}))} from={range.from==='2000-01-01'&&base.paid.length?base.paid.map(p=>p.receivedDate??p.date).sort()[0]:range.from} to={range.to} comparison={comparison&&prior?{...comparison,points:prior.paid.map(p=>({date:p.receivedDate??p.date,amount:p.amount-p.commission}))}:undefined}/>
   </Panel>
   <Panel title={tr('Клиенты по этапам','Clients by stage')} note={tr('Текущая клиентская база','Current client base')} className="ao-segments">
    <ClientStageDistribution stages={segments}/>
   </Panel>
   <Panel title={tr('Доход по услугам','Income by service')} note={tr('После комиссии · доля общего дохода','After fees · share of total income')} className="ao-services" action={link(tr('Все услуги','All services'),'income')}>
    {services.length?<div className="ao-horizontal">{services.slice(0,5).map((s,i)=><button key={s.id} onClick={()=>setSelectedService(s.id)} aria-label={`${s.name}: ${money(s.amount)}. ${tr('Показать оплаты услуги','Show service payments')}`}><span><span>{s.name}</span><strong>{money(s.amount)}</strong></span><span className="ao-bar-track" aria-hidden="true"><i style={{width:`${Math.max(0,s.amount)/highestService*100}%`,background:color(i)}}/></span><small>{s.count} {tr('оплат','payments')} · {s.share===null?'—':`${number(s.share)}%`}</small></button>)}</div>:<p className="ao-empty">{tr('За этот период оплаченных услуг нет.','No paid services in this period.')}</p>}
   </Panel>
   <Panel title={tr('Встречи по дням недели','Appointments by weekday')} note={tr('Без отменённых встреч','Excluding cancelled appointments')} className="ao-weekdays">
    <AnalyticsColumns slices={weekdays.map((label,i)=>({label,value:base.weekdays[i]}))} unit={tr('встреч','appointments')}/>
   </Panel>
   <Panel title={tr('Статусы встреч','Appointment status')} className="ao-status">
    <AnalyticsRing slices={[{label:tr('Запланировано','Scheduled'),value:base.appointments.filter(a=>a.status==='confirmed').length},{label:tr('Завершено','Completed'),value:base.completed,color:2},{label:tr('Отменено','Cancelled'),value:base.appointments.filter(a=>a.status==='cancelled'&&a.attendance!=='no-show').length,color:4},{label:tr('Неявки','No-shows'),value:base.appointments.filter(a=>a.status==='cancelled'&&a.attendance==='no-show').length,color:1}]} label={tr('встреч','appointments')}/>
   </Panel>
   <Panel title={tr('Рабочий ритм','Working rhythm')} note={`${tr('Минуты встреч по часам','Appointment minutes by hour')} · ${practice.profile.timeZone}`} className="ao-hours" action={link(tr('Загрузка','Occupancy'),'practice',true,'time')}>
    <AnalyticsColumns slices={detail.hours.filter(h=>h.hour>=firstHour&&h.hour<=lastHour).map(h=>({label:String(h.hour).padStart(2,'0'),value:h.bookedMinutes}))} unit={tr('мин','min')}/>
    <p className="ao-note">{tr('Встреча распределяется по часам своей длительности. Отмены исключены.','Appointments are split across the hours they occupy. Cancellations are excluded.')}</p>
   </Panel>
   <Panel title={tr('Повторные обращения','Returning business')} className="ao-returning">
    <Ratio label={tr('Повторные оплаты','Repeat payments')} value={base.repeatShare} note={tr(`${base.returning.length} из ${base.clientIds.length} оплативших клиентов имеют две и более оплаты в истории.`,`${base.returning.length} of ${base.clientIds.length} paying clients have two or more payments in their history.`)} colorIndex={2}/>
    <Ratio label={tr('Продления подписок','Subscription renewals')} value={base.retention} note={base.eligible?tr(`${base.renewed} из ${base.eligible} подписок продлено.`,`${base.renewed} of ${base.eligible} subscriptions renewed.`):tr('Пока нет данных о наступивших продлениях.','No data on subscriptions due for renewal yet.')} colorIndex={3}/>
   </Panel>
   <Panel title={tr('Воронка записи','Booking funnel')} className="ao-funnel" action={link(tr('Источники','Sources'),'practice')}>
    <ol>{funnel.map((value,i)=><li key={stageLabels[i]}><div><span>{stageLabels[i]}</span><strong>{value===null?'—':number(value)}</strong></div><div className={value===null?'ao-no-value':'ao-bar-track'}>{value!==null&&<i style={{width:`${value/funnelMax*100}%`,background:color(i)}}/>}</div></li>)}</ol>
    {!base.coverage&&<p className="ao-note">{tr('Нет полного учёта посещений за период. Оплаты сами по себе не показывают конверсию.','Visits are not fully recorded for this period. Payments alone do not establish conversion.')}</p>}
   </Panel>
   <Panel title={tr('Цель месяца','Monthly goal')} note={new Intl.DateTimeFormat(localeTag(),{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(range.to+'T12:00:00Z'))} className="ao-goal">
    {goal&&progress?<><strong className="ao-goal-number">{Math.round(progress.percent)}<span>%</span></strong><progress value={Math.min(100,progress.percent)} max={100} aria-label={tr('Выполнение цели месяца','Monthly goal progress')}/><p>{money(progress.received)} / {money(goal.target)}</p><p className="ao-note">{tr('Доход после комиссии за весь месяц цели.','Net income for the full goal month.')}</p></>:<><div className="ao-goal-empty" aria-hidden="true"><Icon name="analytics" size={28}/></div><p>{tr('Цель ещё не задана','No goal set yet')}</p><p className="ao-note">{tr('Задайте сумму дохода после комиссии, чтобы видеть прогресс месяца.','Set a net income target to track your monthly progress.')}</p></>}
    {link(goal?tr('Изменить цель','Edit goal'):tr('Задать цель','Set goal'),'practice',true)}
   </Panel>
   <Panel title={tr('Доход по клиентам','Income by client')} note={tr('После комиссии · за выбранный период','After fees · selected period')} className="ao-clients" action={link(tr('Все клиенты','All clients'),'income')}>
    {clientRevenue.length?<div className="ao-client-list">{clientRevenue.slice(0,5).map((c,i)=><button key={c.id} disabled={!practice.clients.some(client=>client.id===c.id)} onClick={()=>onClient(c.id)}><span className="ao-client-initial" style={{'--ao-accent':color(i)} as CSSProperties}>{c.name.split(/\s+/).slice(0,2).map(s=>s[0]).join('')}</span><span>{c.name}</span><strong>{money(c.amount)}</strong><Icon name="arrow" size={16}/></button>)}</div>:<p className="ao-empty">{tr('Клиенты появятся после первой оплаты.','Clients appear after their first payment.')}</p>}
   </Panel>
   <Panel title={tr('Конверсия','Conversion')} className="ao-conversion">
    <Ratio label={tr('Посещение → заявка','Visit → lead')} value={base.visitToLead} note={tr('По подтверждённым событиям одного посетителя.','Based on verified events for the same visitor.')} colorIndex={4}/>
    <Ratio label={tr('Заявка → оплата','Lead → payment')} value={base.leadToPaid} note={tr('Оплата связана с заказом и клиентом.','Payment is linked to the order and client.')} colorIndex={1}/>
   </Panel>
  </div>
  {selectedService&&<Dialog placement="drawer" title={services.find(s=>s.id===selectedService)?.name??tr('Оплаты услуги','Service payments')} onClose={()=>setSelectedService(null)}><div className="ep-dialog-body ao-service-dialog"><p className="ep-muted">{formatDate(range.from)} — {formatDate(range.to)}</p><div className="ao-service-payments">{base.paid.filter(p=>p.serviceId===selectedService).sort((a,b)=>(b.receivedDate??b.date).localeCompare(a.receivedDate??a.date)).map(p=><button key={p.id} onClick={()=>{setSelectedService(null);onPayment(p)}}><span><strong>{practice.clients.find(c=>c.id===p.clientId)?.name??tr('Клиент удалён','Client deleted')}</strong><small>{formatDate(p.receivedDate??p.date)} · {p.id}</small></span><span><strong>{money(p.amount-p.commission)}</strong><small>{tr('После комиссии','After fees')}</small></span><Icon name="arrow" size={16}/></button>)}</div></div></Dialog>}
  <footer className="ao-footer">{link(tr('Все показатели, сравнение и экспорт','All metrics, comparison and export'),'practice',true)}</footer>
 </div>
}
