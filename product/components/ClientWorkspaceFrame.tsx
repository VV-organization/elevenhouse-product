import {useEffect,useRef,useState,type ReactNode} from 'react'
import type {Client,Practice} from '../state/model'
import {formatDate} from '../state/model'
import {matchesClientQuery} from '../state/clientSearch'
import {tr} from '../i18n'
import {Icon} from './Icon'
import './client-workspace-frame.css'

type Props={activeTab:string;practice:Practice;client:Client;today:string;onClient:(id:string)=>void;onMeeting:(id:string)=>void;children:ReactNode;context:ReactNode}
export function ClientWorkspaceFrame({activeTab,practice,client,today,onClient,onMeeting,children,context}:Props){
 const [query,setQuery]=useState('')
 const [queueOpen,setQueueOpen]=useState(false)
 const [contextOpen,setContextOpen]=useState(false)
 const contextPanel=useRef<HTMLElement>(null),contextToggle=useRef<HTMLButtonElement>(null)
 useEffect(()=>{setContextOpen(false)},[client.id,activeTab])
 useEffect(()=>{if(contextOpen){contextPanel.current?.focus();contextPanel.current?.scrollIntoView({block:'start'})}},[contextOpen])
 function closeContext(){setContextOpen(false);contextToggle.current?.focus()}
 const queueSearch=useRef<HTMLInputElement>(null),queueToggle=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(queueOpen)queueSearch.current?.focus()},[queueOpen])
 function closeQueue(){setQueueOpen(false);queueToggle.current?.focus()}
 const clients=[...practice.clients].filter(c=>matchesClientQuery(`${c.name} ${c.request} ${c.email||''} ${c.phone||''} ${(c.tags||[]).join(' ')}`,query)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))
 const next=practice.appointments.filter(a=>a.clientId===client.id&&a.status==='confirmed'&&a.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]
 return <div className={`cw-frame${queueOpen?' cw-frame--queue-open':''}${contextOpen?' cw-frame--context-open':''}`}>
 <aside className="cw-queue" onKeyDown={event=>{if(event.key==='Escape'&&queueOpen){event.preventDefault();closeQueue()}}} aria-label={tr('Выбрать клиента','Choose a client')}><div className="cw-queue-heading"><h2>{tr('Клиенты','Clients')}</h2><span>{practice.clients.length}</span></div><label className="cw-search"><Icon name="search" size={16}/><span className="ep-sr-only">{tr('Поиск клиента','Search clients')}</span><input ref={queueSearch} value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr('Найти клиента','Find a client')}/></label><div className="cw-queue-list">{clients.map(c=><button key={c.id} aria-current={c.id===client.id?'true':undefined} onClick={()=>{onClient(c.id);if(queueOpen)closeQueue()}}><span className="ep-avatar ep-avatar--small">{c.name.split(' ').slice(0,2).map(n=>n[0]).join('')}</span><span><strong>{c.name}</strong><small>{c.request||tr('Запрос не указан','No request yet')}</small></span><Icon name="arrow" size={14}/></button>)}{!clients.length&&<p className="ep-muted">{tr('Клиенты не найдены','No matching clients')}</p>}</div></aside>
 <div className="cw-detail"><button ref={queueToggle} className="cw-mobile-queue ep-text-button" aria-expanded={queueOpen} onClick={()=>queueOpen?closeQueue():setQueueOpen(true)}><Icon name="back" size={16}/>{queueOpen?tr('К карточке клиента','Back to client profile'):tr('Выбрать другого клиента','Choose another client')}</button><button ref={contextToggle} className="cw-context-toggle ep-text-button" aria-expanded={contextOpen} aria-controls="cw-client-context" onClick={()=>contextOpen?closeContext():setContextOpen(true)}><Icon name="profile" size={16}/>{tr('Данные, встречи и заказы клиента','Client details, appointments and orders')}<Icon name="down" size={14}/></button><div className="cw-content">{children}</div></div>
 <aside id="cw-client-context" ref={contextPanel} tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'&&contextOpen){event.preventDefault();closeContext()}}} className="cw-context" aria-label={tr('Контекст клиента','Client context')}><button className="cw-context-close ep-text-button" onClick={closeContext}><Icon name="back" size={16}/>{tr('К работе с клиентом','Back to client workspace')}</button>{next&&<section className="cw-next"><h2>{tr('Встреча клиента','Client appointment')}</h2><p className="cw-next-date">{formatDate(next.date)}<span>{next.time} · {next.duration} {tr('мин','min')}</span></p><strong>{next.title}</strong><button className="ep-text-button" onClick={()=>onMeeting(next.id)}>{tr('Открыть встречу','Open appointment')}<Icon name="arrow" size={16}/></button></section>}{context}</aside>
 </div>
}
