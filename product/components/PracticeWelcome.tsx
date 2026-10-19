import type {CSSProperties} from 'react'
import type {Practice} from '../state/model'
import {formatDate} from '../state/model'
import {practiceDay} from '../state/guidedTour'
import {calendarDate,shiftDay} from '../state/calendar'
import {givenName} from '../state/names'
import {tr,localeTag} from '../i18n'
import {Icon} from './Icon'
import './practice-welcome.css'
export function PracticeWelcome({practice}:{practice:Practice}){
 const today=practiceDay(practice.profile.timeZone,practice.isExample)
 const start=shiftDay(today,-((calendarDate(today).getUTCDay()+6)%7))
 const days=Array.from({length:7},(_,i)=>{const date=shiftDay(start,i);return {date,count:practice.appointments.filter(a=>a.date===date&&a.status!=='cancelled').length}})
 const noun=totalLabel(days.reduce((n,d)=>n+d.count,0))
 const max=Math.max(1,...days.map(d=>d.count)),total=days.reduce((n,d)=>n+d.count,0)
 return <section className="pw-welcome" aria-label={tr('Обзор недели','Week overview')}><div className="pw-intro"><p>{formatDate(today)}</p><h2>{tr('Здравствуйте','Hello')}, {givenName(practice.profile.name)}</h2><a href="#calendar"><strong>{total}</strong><span>{tr(`${noun} на этой неделе`,`${total===1?'appointment':'appointments'} this week`)}<Icon name="arrow" size={17}/></span></a></div><div className="pw-week" aria-label={tr('Встречи по дням недели','Appointments by weekday')}>{days.map(d=><div key={d.date} className={d.date===today?'is-today':''}><div className={`pw-bar-space${d.count?'':' is-empty'}`}><span style={{'--pw-height':`${d.count/max*100}%`} as CSSProperties}><b>{d.count}</b></span></div><span>{calendarDate(d.date).toLocaleDateString(localeTag(),{weekday:'short',timeZone:'UTC'})}</span><small>{Number(d.date.slice(-2))}</small></div>)}</div><a className="pw-day-link" href="#today">{tr('Мой рабочий день','My working day')}<Icon name="arrow" size={18}/></a></section>
}

function totalLabel(count:number){return count%100>=11&&count%100<=14?'встреч':count%10===1?'встреча':count%10>=2&&count%10<=4?'встречи':'встреч'}
