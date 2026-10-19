import {useState,useRef} from 'react'
import {useEntranceMotion} from './useEntranceMotion'
import {tr,LanguageControl} from '../i18n'
import {givenName} from '../state/names'
import {Icon} from './Icon'
import logo from '../assets/brand/eleven-house-stacked.svg'
export type StartIntent='calculate'|'calendar'|null
export function PracticeStart({name,onBegin,onLogout}:{name:string;onBegin:(intent:StartIntent)=>void;onLogout:()=>void}){
 const contentRef=useRef<HTMLDivElement>(null)
 useEntranceMotion(contentRef,'start')
 const [intent,setIntent]=useState<'calculate'|'calendar'>('calendar')
 return <main className="ep-start">
      <header><img src={logo} alt="ElevenHouse" width="104"/><LanguageControl/><button className="ep-text-button" onClick={()=>onLogout()}>{tr("Выйти","Sign out")}</button></header>
      <div ref={contentRef} className="ep-start-content"><h1>{tr("С чего начнём","Where shall we start")}{name!=='Моя практика'?`, ${givenName(name)}`:''}?</h1><p className="ep-lead">{tr("Выберите первую задачу. Остальное можно настроить, когда понадобится.","Choose your first task. You can set up everything else when you need it.")}</p>
        <fieldset className="ep-start-options"><legend className="ep-sr-only">{tr("Первая задача","First task")}</legend>{[
          ['calendar','calendar',tr("Записать клиента на консультацию","Book a client consultation"),tr("Добавим клиента и выберем время. Услуги можно настроить позже.","Add a client and choose a time. You can set up services later.")],
          ['calculate','chart',tr("Подготовить расчёт","Prepare a calculation"),tr("Введите данные рождения или выберите клиента. Остальное можно заполнить позже.","Enter birth details or choose a client. You can add the rest later.")],
        ].map(([value,icon,title,description])=><label key={value} className={intent===value?'is-selected':''}><input type="radio" name="intent" value={value} checked={intent===value} onChange={()=>setIntent(value as typeof intent)}/><span className="ep-choice-icon"><Icon name={icon}/></span><span><strong>{title}</strong><small>{description}</small></span><span className="ep-radio" aria-hidden="true"/></label>)}</fieldset>
        <div className="ep-start-actions"><button className="ep-button ep-button--primary" onClick={()=>onBegin(intent)}>{intent==='calendar'?tr("Записать первого клиента","Book your first client"):tr("Перейти к данным рождения","Enter birth details")} <Icon name="arrow"/></button><button className="ep-text-button" onClick={()=>onBegin(null)}>{tr("Начну самостоятельно","Explore on my own")}</button></div>
      </div>
    </main>
}
