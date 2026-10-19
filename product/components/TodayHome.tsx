import type {ReactNode} from 'react'
import {tr} from '../i18n'
import type {Appointment,Client,Practice} from '../state/model'
import {matchesClientQuery} from '../state/clientSearch'
import {TodayAgenda} from './TodayAgenda'
import {PracticeTasks} from './PracticeTasks'
import {Icon} from './Icon'
import './today-home.css'

type Props={practice:Practice;items:Appointment[];recentClients:Client[];incompleteClients:Client[];search:string;onSearch:(value:string)=>void;tools:ReactNode;pending:ReactNode;onMeeting:(id:string)=>void;onClient:(id:string)=>void;onMissing:(id:string)=>void;onPrepare:(id:string)=>void;onNew:()=>void;onNewClient:()=>void;onCalculations:()=>void;onMessages:()=>void;onReminders:()=>void}
export function TodayHome({practice,items,recentClients,incompleteClients,search,onSearch,tools,pending,onMeeting,onClient,onMissing,onPrepare,onNew,onNewClient,onCalculations,onMessages,onReminders}:Props){
 const planned=items.filter(a=>a.status==='confirmed'),minutes=planned.reduce((sum,a)=>sum+a.duration,0)
 const completed=items.filter(a=>a.status==='completed').length
 const found=recentClients.filter(c=>matchesClientQuery(c.name,search))
 const visible=search?found.slice(0,6):recentClients.slice(0,3)
 const duration=minutes>=60?`${Math.floor(minutes/60)} ${tr('ч','h')}${minutes%60?` ${minutes%60} ${tr('мин','min')}`:''}`:`${minutes} ${tr('мин','min')}`
 return <div className="td-home">
  <div className="td-day-strip"><dl className="td-day-metrics"><div><dt>{tr('Запланировано','Scheduled')}</dt><dd>{planned.length}<Icon name="calendar" size={19}/></dd></div><div><dt>{tr('Время по плану','Scheduled time')}</dt><dd>{duration}</dd></div><div><dt>{tr('Завершено','Completed')}</dt><dd>{completed}<span className="td-completed-dot" aria-hidden="true"/></dd></div></dl><div className="td-quick-actions"><button className="ep-text-button" onClick={onCalculations}><Icon name="chart" size={19}/>{tr('Открыть расчёт','Open calculations')}</button><button className="ep-text-button" onClick={onNewClient}><Icon name="plus" size={18}/>{tr('Добавить клиента','Add a client')}</button></div></div>
  <div className="td-columns"><TodayAgenda practice={practice} items={items} onMeeting={onMeeting} onClient={onClient} onNew={onNew} onPrepare={onPrepare}/><aside className="td-context" aria-label={tr('Задачи и инструменты дня','Daily tasks and tools')}>
   <div className="td-attention">{pending}<PracticeTasks practice={practice} onMeeting={onMeeting} onMessages={onMessages} onReminders={onReminders}/>{incompleteClients.length>0&&<section className="td-missing"><h2>{tr('Уточнить перед встречей','Check before the appointment')}</h2>{incompleteClients.map(c=><button key={c.id} onClick={()=>onMissing(c.id)}><span><strong>{c.name}</strong><small>{tr('Не указаны: ','Missing: ')}{[!c.birthDate&&tr('дата рождения','birth date'),!c.birthPlace&&tr('место рождения','birth place'),!c.birthTime&&!c.unknownTime&&tr('время рождения','birth time')].filter(Boolean).join(', ')}</small></span><Icon name="arrow" size={16}/></button>)}</section>}</div>
   {tools}
   <section className="td-clients"><header className="td-section-head"><h2>{search?tr('Поиск клиентов','Find clients'):tr('Недавние клиенты','Recent clients')}</h2><a href="#clients">{tr('Все','All')}<Icon name="arrow" size={15}/></a></header><label className="td-client-search"><Icon name="search" size={18}/><input aria-label={tr('Найти клиента на главной','Find a client on the home screen')} placeholder={tr('Имя или фамилия','First or last name')} value={search} onChange={e=>onSearch(e.target.value)}/>{search&&<button aria-label={tr('Очистить поиск','Clear search')} onClick={()=>onSearch('')}><Icon name="close" size={16}/></button>}</label><div className="td-client-list">{visible.map(c=><button key={c.id} onClick={()=>{onSearch('');onClient(c.id)}}><span className="td-person-avatar" aria-hidden="true">{c.name.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('')}</span><span>{c.name}</span><Icon name="arrow" size={15}/></button>)}</div>{search&&!found.length&&<div className="td-no-client"><p>{tr('Клиент не найден.','Client not found.')}</p><button className="ep-text-button" onClick={onNewClient}>{tr('Добавить клиента','Add a client')}</button></div>}{search&&found.length>6&&<a className="ep-text-button" href="#clients">{tr('Все клиенты','All clients')}<Icon name="arrow" size={16}/></a>}</section>
   <a className="td-practice-link" href="#dashboard"><Icon name="analytics" size={18}/>{tr('Обзор всей практики','Practice overview')}<Icon name="arrow" size={16}/></a>
  </aside></div>
 </div>
}
