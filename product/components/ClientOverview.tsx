import {useState,type ReactNode} from 'react'
import {tr,localeTag} from '../i18n'
import type {Client,Practice} from '../state/model'
import {useModuleState} from '../modules/ModuleKit'
import type {SavedAstronomy} from '../state/astronomyHistory'
import {hasSavedNatalChart} from '../state/calculationData'
import {marinaNatalReference} from '../state/natalReference'
import {AstronomyCalculationSource} from './AstronomyCalculationHistory'
import {MethodCalculationSource} from './SavedCalculationHistory'
import {ChartPreview} from './Chart'
import {ComparisonWheel} from './ComparisonWheel'
import {validAstronomyResult} from '../state/calculationPresentation'
import {Icon} from './Icon'
import './client-overview.css'
type OverviewParts={metrics:ReactNode;calculations:ReactNode}
export function ClientOverview({practice,client,onMethod,render}:{practice:Practice;client:Client;onMethod:(method:string,savedKey?:string)=>void;render?:(parts:OverviewParts)=>ReactNode}){
 const [astronomy]=useModuleState<SavedAstronomy[]>('saved-astronomy-calculations',practice.isExample,()=>[])
 const [methods]=useModuleState<Record<string,{at:string;result:unknown}>>('saved-method-calculations',practice.isExample,()=>({}))
 const [source,setSource]=useState(''),[numericSource,setNumericSource]=useState(''),[showAll,setShowAll]=useState(false)
 const saved=astronomy.filter(r=>r.clientId===client.id).sort((a,b)=>b.at.localeCompare(a.at))
 const numeric=Object.entries(methods).filter(([key])=>key.startsWith(client.id+':'))
 const natal=saved.find(r=>r.result.kind==='natal-reference')
 const preview=natal?.result.kind==='natal-reference'?natal.result.data:hasSavedNatalChart(client,practice.isExample)?marinaNatalReference:null
 const chartRecord=saved.find(r=>r.result.kind==='astrology'&&validAstronomyResult(r.result))
 const chart=chartRecord?.result.kind==='astrology'?chartRecord.result:null
 const records=[...saved.map(record=>({key:record.id,title:record.title,at:record.at,open:()=>setSource(record.id)})),...numeric.map(([key,record])=>({key,title:key.split(':')[1]==='numbers'?tr('Нумерология','Numerology'):tr('Матрица судьбы','Destiny matrix'),at:record.at,open:()=>setNumericSource(key)}))].sort((a,b)=>b.at.localeCompare(a.at))
 const meetings=practice.appointments.filter(a=>a.clientId===client.id)
 const date=(at:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',year:'numeric'}).format(new Date(at))
 const metrics=<div className="co-metrics" aria-label={tr('Работа с клиентом в цифрах','Client activity in numbers')}><div><Icon name="calendar" size={28}/><strong>{meetings.filter(a=>a.status==='completed').length}</strong><span>{tr('проведено встреч','completed appointments')}</span></div><div><Icon name="chart" size={28}/><strong>{saved.length+numeric.length}</strong><span>{tr('сохранённых расчётов','saved calculations')}</span></div><div><Icon name="note" size={28}/><strong>{meetings.filter(a=>a.outcome?.trim()).length}</strong><span>{tr('итогов консультаций','consultation outcomes')}</span></div><div><Icon name="calendar" size={28}/><strong>{meetings.length}</strong><span>{tr('всего встреч','total appointments')}</span></div></div>
 const calculations=<div className="co-calculations">
  <div className="co-section-head"><h2><span className="cp-symbol cp-symbol--plum"><Icon name="chart" size={20}/></span>{tr('Карты и расчёты','Charts and calculations')}</h2><button className="ep-icon-button" aria-label={tr('Новый расчёт','New calculation')} onClick={()=>onMethod('natal')}><Icon name="plus" size={18}/></button></div>
  {(preview||chart||records.length>0)&&<div className={`co-record-workspace${preview||chart?'':' co-record-workspace--list'}`}>
   {(preview||chart)&&<button className="co-chart-link" onClick={()=>chartRecord?setSource(chartRecord.id):natal?setSource(natal.id):onMethod('natal')}>
    {chart?<div className="co-chart-preview" aria-hidden="true" inert><ComparisonWheel result={chart} selected="" showAspects compact onSelect={()=>{}}/></div>:preview&&<ChartPreview data={preview}/>}
    <span>{chartRecord?.title||tr('Натальная карта','Natal chart')}<Icon name="arrow" size={16}/></span>
   </button>}
   {records.length>0&&<div className="co-saved"><h3>{tr('Сохранено','Saved')} <span>{records.length}</span></h3>{(showAll?records:records.slice(0,3)).map(record=><button key={record.key} onClick={record.open}><span><strong>{record.title}</strong><small>{date(record.at)}</small></span><Icon name="arrow" size={16}/></button>)}{records.length>3&&<button className="co-saved-toggle" aria-expanded={showAll} onClick={()=>setShowAll(!showAll)}>{showAll?tr('Свернуть','Show less'):tr('Все расчёты','All calculations')+' · '+records.length}<Icon name="chevron" size={14}/></button>}</div>}
  </div>}
  <div className="co-methods" aria-label={tr('Создать расчёт','Create calculation')}>{[['natal','chart','Астрология','Astrology'],['numbers','analytics','Нумерология','Numerology'],['matrix','practice','Матрица судьбы','Destiny matrix'],['hd','profile','Дизайн человека','Human Design']].map(([method,icon,ru,en])=><button key={method} onClick={()=>onMethod(method)}><Icon name={icon} size={18}/><span>{tr(ru,en)}</span><Icon name="arrow" size={14}/></button>)}</div>
 </div>
 return <>{render?render({metrics,calculations}):<section className="co-overview" aria-label={tr('Сводка клиента','Client summary')}>{metrics}{calculations}</section>}{numericSource&&<MethodCalculationSource records={methods} clientId={client.id} recordKey={numericSource} onClose={()=>setNumericSource('')}/>} {source&&<AstronomyCalculationSource id={source} practice={practice} onClose={()=>setSource('')}/>}</>
}
