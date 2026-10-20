import {useRef} from 'react'
import {useEntranceMotion} from './useEntranceMotion'
import {tr,LanguageControl} from '../i18n'
import {FirstPracticeStep} from './FirstPracticeStep'
import logo from '../assets/brand/eleven-house-stacked.svg'
export type StartIntent='calculate'|'calendar'|null
export function PracticeStart({name,onBegin,onLogout}:{name:string;onBegin:(intent:StartIntent)=>void;onLogout:()=>void}){
 const contentRef=useRef<HTMLDivElement>(null)
 useEntranceMotion(contentRef,'start')
 return <main className="ep-start ep-first-start">
      <header><img src={logo} alt="ElevenHouse" width="104"/><LanguageControl/><button className="ep-text-button" onClick={()=>onLogout()}>{tr("Выйти","Sign out")}</button></header>
      <div ref={contentRef} className="ep-start-content"><FirstPracticeStep standalone name={name} onBegin={onBegin} onExplore={()=>onBegin(null)}/></div>
    </main>
}
