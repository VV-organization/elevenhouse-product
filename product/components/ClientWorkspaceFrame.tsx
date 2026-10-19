import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {Client,Practice} from '../state/model'
import {formatDate} from '../state/model'
import {matchesClientQuery} from '../state/clientSearch'
import {tr} from '../i18n'
import {Icon} from './Icon'
import {Select} from './Select'
import {clientStages} from './ClientCRM'
import './client-workspace-frame.css'

type Props={activeTab:string;practice:Practice;client:Client;today:string;onClient:(id:string)=>void;onMeeting:(id:string)=>void;children:ReactNode;context:ReactNode}
export function ClientWorkspaceFrame({activeTab,practice,client,today,onClient,onMeeting,children,context}:Props){
 const [query,setQuery]=useState('')
 const [stage,setStage]=useState('all')
 const [queueOpen,setQueueOpen]=useState(false)
 const [contextOpen,setContextOpen]=useState(false)
 const contextPanel=useRef<HTMLElement>(null),contextToggle=useRef<HTMLButtonElement>(null)
 useEffect(()=>{setContextOpen(false)},[client.id,activeTab])
 useEffect(()=>{if(contextOpen){contextPanel.current?.focus();contextPanel.current?.scrollIntoView({block:'start'})}},[contextOpen])
 function closeContext(){setContextOpen(false);contextToggle.current?.focus()}
 const queueSearch=useRef<HTMLInputElement>(null),queueToggle=useRef<HTMLButtonElement>(null),queueList=useRef<HTMLDivElement>(null),queueScroll=useRef(0)
 useEffect(()=>{if(queueOpen){if(queueList.current)queueList.current.scrollTop=queueScroll.current;queueSearch.current?.focus({preventScroll:true})}},[queueOpen])
 function closeQueue(){setQueueOpen(false);queueToggle.current?.focus()}
 const stages=[...clientStages(),...(practice.clientStages||[]).map(s=>[s.id,s.label])]
 const clients=[...practice.clients].filter(c=>(stage==='all'||(c.stage||'')===stage)&&matchesClientQuery(`${c.name} ${c.request} ${c.email||''} ${c.phone||''} ${(c.tags||[]).join(' ')}`,query)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
 const next=practice.appointments.filter(a=>a.clientId===client.id&&a.status==='confirmed'&&a.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]
 return <div data-client-view={activeTab} className={`cw-frame${queueOpen?' cw-frame--queue-open':''}${contextOpen?' cw-frame--context-open':''}`}>
 <aside id="cw-client-queue" className="cw-queue" onKeyDown={event=>{if(event.key==='Escape'&&queueOpen&&!event.defaultPrevented&&!(event.target as HTMLElement).closest('[role="combobox"],[role="listbox"]')){event.preventDefault();closeQueue()}}} aria-label={tr('Выбрать клиента','Choose a client')}>
  <div className="cw-queue-heading"><h2>{tr('Клиенты','Clients')}</h2><span>{practice.clients.length}</span></div>
  <label className="cw-search"><Icon name="search" size={18}/><span className="ep-sr-only">{tr('Поиск клиента','Search clients')}</span><input ref={queueSearch} value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('Имя, контакт или метка','Name, contact or tag')}/>{query&&<button aria-label={tr('Очистить поиск клиентов','Clear client search')} onClick={()=>{setQuery('');queueSearch.current?.focus()}}><Icon name="close" size={16}/></button>}</label>
  <div className="cw-queue-filter"><Select aria-label={tr('Этап клиентов в боковой панели','Client stage in sidebar')} value={stage} onChange={e=>setStage(e.target.value)}><option value="all">{tr('Все этапы','All stages')}</option><option value="">{tr('Этап не указан','Stage not set')}</option>{stages.map(([id,label])=><option key={id} value={id}>{label}</option>)}</Select><span role="status">{tr('Найдено','Found')}: {clients.length}</span></div>
  <div ref={queueList} className="cw-queue-list" onScroll={event=>{if(queueOpen||window.matchMedia('(min-width: 1001px)').matches)queueScroll.current=event.currentTarget.scrollTop}}>{clients.map(c=><button key={c.id} aria-current={c.id===client.id?'true':undefined} onClick={()=>{queueScroll.current=queueList.current?.scrollTop||0;onClient(c.id);if(queueOpen)closeQueue()}}><span className="ep-avatar ep-avatar--small" aria-hidden="true">{c.name.split(' ').slice(0,2).map(n=>n[0]).join('')}</span><span><strong>{c.name}</strong><small>{c.request||tr('Запрос не указан','No request yet')}</small><span className="cw-queue-stage">{stages.find(([id])=>id===c.stage)?.[1]||tr('Этап не указан','Stage not set')}</span></span><Icon name="arrow" size={14}/></button>)}{!clients.length&&<div className="cw-queue-empty"><p>{tr('Клиенты не найдены','No matching clients')}</p><button className="ep-text-button" onClick={()=>{setQuery('');setStage('all')}}>{tr('Сбросить фильтры','Clear filters')}</button></div>}</div>
  <a className="cw-all-clients" href="#clients">{tr('Весь список и этапы','All clients and stages')}<Icon name="arrow" size={16}/></a>
 </aside>
 <div className="cw-detail"><button ref={queueToggle} className="cw-mobile-queue ep-text-button" aria-expanded={queueOpen} aria-controls="cw-client-queue" onClick={()=>queueOpen?closeQueue():setQueueOpen(true)}><Icon name="back" size={16}/>{queueOpen?tr('К карточке клиента','Back to client profile'):tr('Выбрать другого клиента','Choose another client')}</button><button ref={contextToggle} className="cw-context-toggle ep-text-button" aria-expanded={contextOpen} aria-controls="cw-client-context" onClick={()=>contextOpen?closeContext():setContextOpen(true)}><Icon name="profile" size={16}/>{tr('Данные, встречи и заказы клиента','Client details, appointments and orders')}<Icon name="down" size={14}/></button><div className="cw-content">{children}</div></div>
 <aside id="cw-client-context" ref={contextPanel} tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'&&contextOpen){event.preventDefault();closeContext()}}} className="cw-context" aria-label={tr('Контекст клиента','Client context')}><button className="cw-context-close ep-text-button" onClick={closeContext}><Icon name="back" size={16}/>{tr('К работе с клиентом','Back to client workspace')}</button>{next&&<section className="cw-next"><h2>{tr('Встреча клиента','Client appointment')}</h2><p className="cw-next-date">{formatDate(next.date)}<span>{next.time} · {next.duration} {tr('мин','min')}</span></p><strong>{next.title}</strong><button className="ep-text-button" onClick={()=>onMeeting(next.id)}>{tr('Открыть встречу','Open appointment')}<Icon name="arrow" size={16}/></button></section>}{context}</aside>
 </div>
}
