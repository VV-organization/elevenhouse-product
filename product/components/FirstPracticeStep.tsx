import {useState} from 'react'
import {tr} from '../i18n'
import {givenName} from '../state/names'
import {Icon} from './Icon'
import {ChartPreview} from './Chart'
import {marinaNatalReference} from '../state/natalReference'
import './first-practice-step.css'

export type FirstPracticeIntent='calendar'|'calculate'

/** UN Icon empty-state composition + G-med calendar; previews never populate the account. */
export function FirstPracticeStep({name,onBegin,onExplore,onAddClient,standalone=false}:{name:string;onBegin:(intent:FirstPracticeIntent)=>void;onExplore?:()=>void;onAddClient?:()=>void;standalone?:boolean}){
 const [intent,setIntent]=useState<FirstPracticeIntent>('calendar')
 const Heading=standalone?'h1':'h2'
 return <section className="fp-start" aria-label={tr('Начало работы','Getting started')}>
  <div className="fp-copy">
   <Heading>{tr('С чего начнём','Where shall we start')}{name&&name!=='Моя практика'?`, ${givenName(name)}`:''}?</Heading>
   <p className="fp-intro">{tr('С вашей первой консультации или с расчёта.','With your first consultation or a calculation.')}</p>
   <fieldset className="fp-choices"><legend className="ep-sr-only">{tr('Первая задача','First task')}</legend>
    {([
     ['calendar','calendar',tr('Записать клиента на консультацию','Book a client consultation'),tr('Клиент, время и заметки к встрече','Client, time and appointment notes')],
     ['calculate','chart',tr('Подготовить расчёт','Prepare a calculation'),tr('Можно начать со своих данных','You can start with your own details')],
    ] as const).map(([value,icon,title,detail])=><label key={value} className={intent===value?'is-selected':''}>
     <input type="radio" name="first-practice-intent" value={value} checked={intent===value} onChange={()=>setIntent(value)}/>
     <span className="fp-choice-icon"><Icon name={icon} size={22}/></span><span><strong>{title}</strong><small>{detail}</small></span><span className="fp-radio" aria-hidden="true"/>
    </label>)}
   </fieldset>
   <div className="fp-actions"><button className="ep-button ep-button--primary" onClick={()=>onBegin(intent)}>{intent==='calendar'?tr('Записать первого клиента','Book your first client'):tr('Перейти к данным рождения','Enter birth details')}<Icon name="arrow" size={18}/></button>
    {onExplore&&<button className="ep-text-button" onClick={onExplore}>{tr('Начну самостоятельно','Explore on my own')}</button>}
    {onAddClient&&<button className="ep-text-button" onClick={onAddClient}>{tr('Добавить клиента без встречи','Add a client without an appointment')}</button>}
   </div>
  </div>
  <figure className={`fp-preview fp-preview--${intent}`}>
   <div className="fp-preview-heading"><span><Icon name={intent==='calendar'?'calendar':'chart'} size={18}/>{intent==='calendar'?tr('Ваша первая встреча','Your first appointment'):tr('Ваш первый расчёт','Your first calculation')}</span></div>
   <div key={intent} className="fp-preview-scene">
    {intent==='calendar'?<div className="fp-calendar-preview" aria-hidden="true">
     <div className="fp-week-strip">{[tr('Пн','Mon'),tr('Вт','Tue'),tr('Ср','Wed'),tr('Чт','Thu'),tr('Пт','Fri')].map((day,i)=><span key={day} className={i===2?'is-active':''}>{day}<b>{12+i}</b></span>)}</div>
     <div className="fp-schedule"><span className="fp-hour">10:00</span><i/><span className="fp-hour">11:00</span><div className="fp-sample-meeting"><span className="fp-sample-avatar">{tr('МИ','MI')}</span><div><strong>{tr('Марина Иванова','Marina Ivanova')}</strong><span>{tr('Первая консультация','First consultation')}</span><small>11:00 – 12:00</small></div></div><span className="fp-hour">12:00</span><i/></div>
     <div className="fp-linked-note"><Icon name="note" size={20}/><div><strong>{tr('Заметки к встрече','Appointment notes')}</strong><span>{tr('Запрос, наблюдения, договорённости','Request, observations, agreements')}</span></div></div>
    </div>:<div className="fp-chart-preview"><ChartPreview data={marinaNatalReference}/><span>{tr('Натальная карта','Natal chart')}</span></div>}
   </div>
   <figcaption>{intent==='calendar'?tr('Встреча и заметки — в карточке клиента.','The appointment and notes stay in the client’s profile.'):tr('Ваш расчёт начнётся с данных рождения.','Your calculation starts with birth details.')}</figcaption>
  </figure>
 </section>
}
