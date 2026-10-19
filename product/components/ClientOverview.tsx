import {useState} from 'react'
import {tr,localeTag} from '../i18n'
import type {Client,Practice} from '../state/model'
import {useModuleState} from '../modules/ModuleKit'
import type {SavedAstronomy} from '../state/astronomyHistory'
import {hasSavedNatalChart} from '../state/calculationData'
import {marinaNatalReference} from '../state/natalReference'
import {AstronomyCalculationSource} from './AstronomyCalculationHistory'
import {MethodCalculationSource} from './SavedCalculationHistory'
import {ChartPreview} from './Chart'
import {Icon} from './Icon'
import './client-overview.css'
export function ClientOverview({practice,client,onMethod}:{practice:Practice;client:Client;onMethod:(method:string,savedKey?:string)=>void}){
 const [astronomy]=useModuleState<SavedAstronomy[]>('saved-astronomy-calculations',practice.isExample,()=>[])
 const [methods]=useModuleState<Record<string,{at:string;result:unknown}>>('saved-method-calculations',practice.isExample,()=>({}))
 const [source,setSource]=useState(''),[numericSource,setNumericSource]=useState('')
 const saved=astronomy.filter(r=>r.clientId===client.id).sort((a,b)=>b.at.localeCompare(a.at))
 const numeric=Object.entries(methods).filter(([key])=>key.startsWith(client.id+':'))
 const natal=saved.find(r=>r.result.kind==='natal-reference')
 const preview=natal?.result.kind==='natal-reference'?natal.result.data:hasSavedNatalChart(client,practice.isExample)?marinaNatalReference:null
 const meetings=practice.appointments.filter(a=>a.clientId===client.id)
 const date=(at:string)=>new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'short',year:'numeric'}).format(new Date(at))
 return <section className="co-overview" aria-label={tr('Сводка клиента','Client summary')}><div className="co-metrics"><div><Icon name="calendar" size={18}/><strong>{meetings.filter(a=>a.status==='completed').length}</strong><span>{tr('проведено встреч','completed appointments')}</span></div><div><Icon name="chart" size={18}/><strong>{saved.length+numeric.length}</strong><span>{tr('сохранённых расчётов','saved calculations')}</span></div><div><Icon name="note" size={18}/><strong>{meetings.filter(a=>a.outcome?.trim()).length}</strong><span>{tr('итогов консультаций','consultation outcomes')}</span></div></div><div className="co-calculations"><div className="co-section-head"><h2>{tr('Карты и расчёты','Charts and calculations')}</h2><button className="ep-text-button" onClick={()=>onMethod('natal')}>{tr('Новый расчёт','New calculation')}<Icon name="plus" size={16}/></button></div><div className="co-calculation-layout">{preview&&<button className="co-chart-link" onClick={()=>natal?setSource(natal.id):onMethod('natal')}><ChartPreview data={preview}/><span>{!natal&&practice.isExample?tr('Пример натальной карты','Example natal chart'):tr('Натальная карта','Natal chart')}<Icon name="arrow" size={16}/></span></button>}<div className="co-methods">{[['natal','chart','Астрология','Astrology'],['numbers','analytics','Нумерология','Numerology'],['matrix','practice','Матрица судьбы','Destiny matrix'],['hd','profile','Дизайн человека','Human Design']].map(([method,icon,ru,en])=><button key={method} onClick={()=>onMethod(method)}><Icon name={icon} size={20}/><span>{tr(ru,en)}</span><Icon name="arrow" size={15}/></button>)}</div></div>{(saved.length>0||numeric.length>0)&&<div className="co-saved"><h3>{tr('Сохранено у клиента','Saved for this client')}</h3>{saved.map(record=><button key={record.id} onClick={()=>setSource(record.id)}><span><strong>{record.title}</strong><small>{date(record.at)}</small></span><Icon name="arrow" size={16}/></button>)}{numeric.map(([key,record])=><button key={key} onClick={()=>setNumericSource(key)}><span><strong>{key.split(':')[1]==='numbers'?tr('Нумерология','Numerology'):tr('Матрица судьбы','Destiny matrix')}</strong><small>{date(record.at)}</small></span><Icon name="arrow" size={16}/></button>)}</div>}</div>{numericSource&&<MethodCalculationSource records={methods} clientId={client.id} recordKey={numericSource} onClose={()=>setNumericSource('')}/>} {source&&<AstronomyCalculationSource id={source} practice={practice} onClose={()=>setSource('')}/>}</section>
}
