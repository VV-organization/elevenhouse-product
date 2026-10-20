import {Icon} from '../components/Icon'
import {Dialog} from '../components/Dialog'
import {LanguageControl,localeTag,tr} from '../i18n'
import {useState} from 'react'
import {givenName} from '../state/names'
import type {Booking} from './portal-bookings'
import type {PortalOrder} from './portal-order-model'
import {orderStatusLabel} from './portal-orders'
import {portalContent,contentReadable,type PortalContentData} from './portal-content-model'
import {formatDate} from '../state/model'
import logo from '../assets/brand/eleven-house-stacked.svg'
import './client-portal-presentation.css'

export const portalSections=()=>[
 {id:'home',label:tr('Главная','Home'),icon:'today'},
 {id:'bookings',label:tr('Встречи','Appointments'),icon:'calendar'},
 {id:'messages',label:tr('Сообщения','Messages'),icon:'message'},
 {id:'materials',label:tr('Материалы и дневник','Materials and diary'),icon:'library'},
 {id:'orders',label:tr('Заказы','Orders'),icon:'service'},
 {id:'billing',label:tr('Подписки и оплаты','Subscriptions and payments'),icon:'wallet'},
 {id:'feed',label:tr('Лента специалиста','Specialist feed'),icon:'publication'},
 {id:'profile',label:tr('Мои данные','My details'),icon:'clients'},
]
export function PortalHeader({name,onSelect,onReturn}:{name:string;onSelect:(id:string)=>void;onReturn:()=>void}){
 const [open,setOpen]=useState(false)
 return <header className="pc-header">
  <a className="pc-brand" href="#home" onClick={e=>{e.preventDefault();onSelect('home')}} aria-label={tr('Кабинет клиента — главная','Client portal — home')}><img src={logo} alt="ElevenHouse"/><span>{tr('Кабинет клиента','Client portal')}</span></a>
  <button className="pc-account" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label={tr(`Мой профиль: ${name}`,`My profile: ${name}`)}><span className="pc-avatar">{name.split(' ').slice(0,2).map(s=>s[0]).join('')}</span><span>{givenName(name)}</span><Icon name="down" size={16}/></button>
  {open&&<Dialog title={name||tr('Мой профиль','My profile')} onClose={()=>setOpen(false)}><div className="ep-dialog-body pc-profile-menu"><button className="ep-button" onClick={()=>{setOpen(false);onSelect('profile')}}>{tr('Мои данные и семейные профили','My details and family profiles')}</button><LanguageControl/><button className="ep-text-button" onClick={()=>{setOpen(false);onReturn()}}><Icon name="back"/>{tr('К практике специалиста','Back to practitioner workspace')}</button></div></Dialog>}
 </header>
}
export function PortalNavigation({value,onChange}:{value:string;onChange:(id:string)=>void}){
 const [open,setOpen]=useState(false),items=portalSections()
 const choose=(id:string)=>{setOpen(false);onChange(id)}
 const item=(x:ReturnType<typeof portalSections>[number])=><button key={x.id} aria-current={value===x.id?'page':undefined} onClick={()=>choose(x.id)}><Icon name={x.icon} size={20}/><span>{x.label}</span></button>
 return <><aside className="pc-navigation"><nav aria-label={tr('Кабинет клиента','Client portal')}>{items.map(item)}</nav></aside><nav className="pc-mobile-navigation" aria-label={tr('Кабинет клиента','Client portal')}>{items.slice(0,3).map(item)}<button aria-expanded={open} aria-current={!items.slice(0,3).some(x=>x.id===value)?'page':undefined} onClick={()=>setOpen(true)}><Icon name="menu" size={20}/><span>{tr('Ещё','More')}</span></button></nav>{open&&<Dialog title={tr('Разделы кабинета','Portal sections')} onClose={()=>setOpen(false)}><nav className="ep-dialog-body pc-menu" aria-label={tr('Все разделы кабинета','All portal sections')}>{items.map(item)}</nav></Dialog>}</>
}
export function portalOverviewContent(data:PortalContentData|undefined,clientId:string|undefined,specialistId:string,now=new Date()){
 const content=portalContent(data,clientId,specialistId,now)
 return content.materials.filter(m=>contentReadable('material',m,content.access,now)).slice(0,3)
}
export function PortalOverview({name,astrologer,nearest,timeZone,orders,contentData,clientId,specialistId,lastMessage,onNavigate,onBook,onMeeting,onMaterial,onPrepare}:{name:string;astrologer:string;nearest?:Booking;timeZone:string;orders:PortalOrder[];contentData?:PortalContentData;clientId?:string;specialistId:string;lastMessage?:string;onNavigate:(id:string)=>void;onBook:()=>void;onMeeting:(id:string)=>void;onMaterial:(id:string)=>void;onPrepare:()=>void}){
 const materials=portalOverviewContent(contentData,clientId,specialistId)
 const activeOrders=orders.filter(o=>o.status==='requested'||o.status==='cancellation-requested'||o.status==='accepted'&&o.preparation!=='ready')
 return <div className="pc-overview">
  <div className="pc-page-heading"><h1>{tr(`Здравствуйте, ${givenName(name)}`,`Hello, ${givenName(name)}`)}</h1><button className="ep-button ep-button--primary" onClick={onBook}><Icon name="plus" size={18}/>{tr('Записаться','Book appointment')}</button></div>
  <section className="pc-next-meeting" aria-label={tr('Ближайшая встреча','Next appointment')}>
   <div className="pc-next-copy"><span className="pc-label">{tr('Ближайшая встреча','Next appointment')}</span><h2>{nearest?.title||tr('Начнём с вашего запроса','Start with your question')}</h2><p>{nearest?astrologer:tr('Выберите формат консультации и удобное время.','Choose a consultation format and a convenient time.')}</p>{nearest&&<span className="pc-status"><span/>{nearest.status==='confirmed'?tr('Подтверждена','Confirmed'):tr('Ожидает подтверждения','Awaiting confirmation')}</span>}</div>
   {nearest&&<div className="pc-meeting-date"><span>{formatDate(nearest.date)}</span><strong>{nearest.time}</strong><span>{nearest.duration} {tr('мин','min')} · {timeZone}</span></div>}
   <div className="pc-next-actions">{nearest?<><button className="ep-button ep-button--primary" onClick={()=>onMeeting(nearest.id)}>{tr('Открыть встречу','View appointment')}<Icon name="arrow" size={18}/></button><button className="ep-text-button" onClick={onPrepare}>{tr('Как подготовиться','How to prepare')}</button></>:<button className="ep-button ep-button--primary" onClick={onBook}>{tr('Выбрать консультацию','Choose a consultation')}</button>}</div>
  </section>
  <div className="pc-overview-columns"><section className="pc-materials"><div className="pc-section-heading"><h2>{tr('Ваши материалы','Your materials')}</h2><button className="ep-text-button" onClick={()=>onNavigate('materials')}>{tr('Все материалы','All materials')}<Icon name="arrow" size={16}/></button></div>
   {materials.length?<div className="pc-material-list">{materials.map(m=><button className="pc-material" key={m.id} onClick={()=>onMaterial(m.id)}><span className="pc-material-icon"><Icon name={m.kind==='video'?'video':m.kind==='chart'?'chart':'note'} size={24}/></span><span><small>{new Date(m.createdAt).toLocaleDateString(localeTag())}</small><strong>{m.title}</strong>{m.description&&<span>{m.description}</span>}</span><Icon name="arrow" size={18}/></button>)}</div>:<p className="pc-empty">{tr('Здесь будут материалы, которые специалист откроет для вас.','Materials shared with you by your specialist will appear here.')}</p>}
   <button className="pc-diary-link" onClick={()=>onNavigate('diary')}><Icon name="note" size={20}/><span>{tr('Мой дневник','My diary')}<small>{tr('Личные наблюдения и записи','Private observations and notes')}</small></span><Icon name="arrow" size={18}/></button>
  </section><aside className="pc-overview-aside">
   {lastMessage&&<section className="pc-message-preview"><span className="pc-label">{tr('Последнее сообщение','Latest message')}</span><h2>{astrologer}</h2><p>{lastMessage}</p><button className="ep-text-button" onClick={()=>onNavigate('messages')}>{tr('Открыть переписку','Open conversation')}<Icon name="arrow" size={16}/></button></section>}
   {activeOrders.length>0&&<section className="pc-current-orders"><div className="pc-section-heading"><h2>{tr('Текущие заявки','Current requests')}</h2><span>{activeOrders.length}</span></div>{activeOrders.slice(0,2).map(o=><button key={o.id} onClick={()=>onNavigate('orders')}><strong>{o.title}</strong><span>{orderStatusLabel(o)}</span><Icon name="arrow" size={16}/></button>)}</section>}
   <button className="pc-finance-link" onClick={()=>onNavigate('billing')}><Icon name="wallet"/><span>{tr('Подписки и оплаты','Subscriptions and payments')}</span><Icon name="arrow" size={16}/></button>
  </aside></div>
 </div>
}
