import {ComparisonWheel} from './ComparisonWheel'
import type {AstrologyResult} from '../state/calculationPresentation'
import {ContextHelp} from './ContextHelp'
import {useState,type ReactNode} from 'react'
import {AstroCalculationInsights} from './AstroCalculationInsights'
import {tr} from '../i18n'
import {AstroSymbol} from './AstroSymbol'
import {Dialog} from './Dialog'
import {Icon} from './Icon'
import {chartAspects,houseNumber,zodiacPosition,aspectDefinitions,type NatalChartData,type PlanetKey} from '../state/natalChart'
import './chart.css'
const signs=()=>[tr('Овен','Aries'),tr('Телец','Taurus'),tr('Близнецы','Gemini'),tr('Рак','Cancer'),tr('Лев','Leo'),tr('Дева','Virgo'),tr('Весы','Libra'),tr('Скорпион','Scorpio'),tr('Стрелец','Sagittarius'),tr('Козерог','Capricorn'),tr('Водолей','Aquarius'),tr('Рыбы','Pisces')]
const planetName=(key:PlanetKey)=>({sun:tr('Солнце','Sun'),moon:tr('Луна','Moon'),mercury:tr('Меркурий','Mercury'),venus:tr('Венера','Venus'),mars:tr('Марс','Mars'),jupiter:tr('Юпитер','Jupiter'),saturn:tr('Сатурн','Saturn'),uranus:tr('Уран','Uranus'),neptune:tr('Нептун','Neptune'),pluto:tr('Плутон','Pluto')})[key]
const aspectName=(key:string)=>({conjunction:tr('Соединение','Conjunction'),sextile:tr('Секстиль','Sextile'),square:tr('Квадрат','Square'),trine:tr('Тригон','Trine'),opposition:tr('Оппозиция','Opposition')})[key]
function Position({longitude}:{longitude:number}){const p=zodiacPosition(longitude);return <span className="ep-natal-position"><span>{p.text}</span><small>{signs()[p.sign]}</small></span>}
export function Chart({data,settings}:{data:NatalChartData;settings?:ReactNode}){
 const [selected,setSelected]=useState<PlanetKey|null>(null),[tab,setTab]=useState<'planets'|'houses'|'aspects'>('planets'),[showAspects,setShowAspects]=useState(true),[expanded,setExpanded]=useState(false)
 const aspects=chartAspects(data.planets),active=data.planets.find(p=>p.key===selected)
 const select=(key:PlanetKey)=>setSelected(old=>old===key?null:key)
 const wheel=<NatalWheel data={data} selected={selected} showAspects={showAspects} onSelect={select}/>
 const selection=<div className="ep-natal-selection" role="status">{active?<><AstroSymbol name={active.key} width="22" height="22"/><span><strong>{planetName(active.key)}</strong> · {zodiacPosition(active.longitude).text} {signs()[zodiacPosition(active.longitude).sign]} · {houseNumber(active.longitude,data.cusps)} {tr('дом','house')}{active.speed<0?` · ${tr('Ретроградная','Retrograde')}`:''}</span><button className="ep-text-button" onClick={()=>setSelected(null)}>{tr('Сбросить','Clear')}</button></>:<span>{tr('Нажмите на планету, чтобы выделить её аспекты.','Select a planet to highlight its aspects.')}</span>}</div>
 return <section className="ep-natal" aria-label={tr('Натальная карта','Natal chart')}>
  <div className="ep-natal-heading"><div><h2>{tr('Натальная карта','Natal chart')}</h2><p>{tr('Тропический зодиак','Tropical zodiac')} · {tr('Дома:','Houses:')} {data.houseSystem}</p></div><button className="ep-button" onClick={()=>setExpanded(true)}><Icon name="plus" size={16}/>{tr('Увеличить карту','Enlarge chart')}</button></div>
  {settings}
  <div className="ep-natal-layout"><div className="ep-natal-drawing">{wheel}<div className="ep-natal-controls"><label><input type="checkbox" checked={showAspects} onChange={e=>setShowAspects(e.target.checked)}/>{tr('Показывать аспекты','Show aspects')}</label></div>{selection}<div className="ep-natal-legend">{aspectDefinitions.map(a=><span key={a.key} className={`ep-aspect-${a.tone}`}><i aria-hidden="true">{a.symbol}</i>{aspectName(a.key)}</span>)}</div></div>
  <div className="ep-natal-data"><div className="ep-natal-tabs" role="group" aria-label={tr('Данные карты','Chart data')}>{(['planets','houses','aspects'] as const).map(id=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{({planets:tr('Планеты','Planets'),houses:tr('Дома','Houses'),aspects:tr('Аспекты','Aspects')})[id]}</button>)}</div>
   <div className="ep-natal-positions" role="region" tabIndex={0} aria-label={tr('Данные карты — прокрутка','Chart data — scrollable')}>
   {tab==='planets'&&<><div className="ep-natal-columns" aria-hidden="true"><span>{tr('Планета','Planet')}</span><span>{tr('Положение','Position')}</span><span>{tr('Дом','House')}</span></div>{data.planets.map(p=><button type="button" key={p.key} className="ep-natal-row" aria-pressed={selected===p.key} onClick={()=>select(p.key)}><span className="ep-natal-planet"><AstroSymbol name={p.key} width="22" height="22"/><span>{planetName(p.key)}{p.speed<0&&<abbr title={tr('Ретроградное движение','Retrograde motion')}>R</abbr>}</span></span><Position longitude={p.longitude}/><span className="ep-natal-house-value">{houseNumber(p.longitude,data.cusps)}</span></button>)}</>}
   {tab==='houses'&&<><div className="ep-natal-columns ep-natal-columns--two" aria-hidden="true"><span>{tr('Дом · начало','House · cusp')}</span><span>{tr('Положение','Position')}</span></div>{data.cusps.map((longitude,i)=><div key={i} className="ep-natal-row ep-natal-columns--two"><span><strong>{i+1}</strong>{[0,3,6,9].includes(i)&&<span className="ep-natal-axis-name">{({0:'ASC',3:'IC',6:'DSC',9:'MC'})[i as 0|3|6|9]}</span>}</span><Position longitude={longitude}/></div>)}</>}
   {tab==='aspects'&&<><div className="ep-natal-columns ep-natal-columns--two" aria-hidden="true"><span>{tr('Аспект','Aspect')}</span><span>{tr('Орбис','Orb')}</span></div>{aspects.filter(a=>!selected||a.a===selected||a.b===selected).map(a=><div key={`${a.a}-${a.b}`} className={`ep-natal-aspect-row ep-aspect-${a.definition.tone}`}><span className="ep-natal-aspect-symbol" aria-hidden="true">{a.definition.symbol}</span><span><strong>{planetName(a.a)} · {planetName(a.b)}</strong><small>{aspectName(a.definition.key)}</small></span><span>{zodiacPosition(a.orb).text}</span></div>)}{selected&&!aspects.some(a=>a.a===selected||a.b===selected)&&<p className="ep-natal-empty">{tr('Нет основных аспектов в выбранных орбисах.','No major aspects within the selected orbs.')}</p>}</>}
   </div><ContextHelp printable title={tr('Параметры карты','Chart parameters')}><p>{tr('Момент расчёта:','Calculation time:')} {data.utc.replace('T',' ').replace('Z',' UTC')}<br/>{tr('Координаты:','Coordinates:')} {data.latitude}°, {data.longitude}°</p><p>{tr('Орбисы аспектов:','Aspect orbs:')} {aspectDefinitions.map(a=>`${aspectName(a.key)} ${a.orb}°`).join(' · ')}</p></ContextHelp>
  </div></div>
  <AstroCalculationInsights layers={[{id:"natal",label:{ru:"Натальная карта",en:"Natal chart"},utc:data.utc,ascendant:data.ascendant,positions:data.planets.map(p=>({key:p.key,label:{ru:planetName(p.key),en:planetName(p.key)},longitude:p.longitude,retrograde:p.speed<0}))}]} aspects={aspects.map(a=>({id:`${a.a}-${a.b}`,from:{layer:"natal",planet:a.a},to:{layer:"natal",planet:a.b},label:{ru:aspectName(a.definition.key)||a.definition.key,en:aspectName(a.definition.key)||a.definition.key},angle:a.definition.angle,orb:a.orb,tone:a.definition.tone}))}/>
  {expanded&&<Dialog title={tr('Натальная карта','Natal chart')} onClose={()=>setExpanded(false)} wide><div className="ep-natal-expanded"><p>{tr('На телефоне карту можно прокручивать в стороны.','On your phone, scroll sideways to inspect the chart.')}</p><div className="ep-natal-zoom-scroll" tabIndex={0} aria-label={tr('Увеличенная карта — прокрутка','Enlarged chart — scrollable')}>{wheel}</div>{selection}</div></Dialog>}
 </section>
}
function NatalWheel({data,selected,showAspects,onSelect,compact=false}:{data:NatalChartData;selected:PlanetKey|null;showAspects:boolean;onSelect:(key:PlanetKey)=>void;compact?:boolean}){
 const result:AstrologyResult={
  kind:'astrology',title:{ru:'Натальная карта',en:'Natal chart'},zodiac:{ru:'Тропический зодиак',en:'Tropical zodiac'},houseSystem:data.houseSystem,
  layers:[{id:'natal',label:{ru:'Натальная карта',en:'Natal chart'},utc:data.utc,ascendant:data.ascendant,midheaven:data.midheaven,cusps:[...data.cusps],
   positions:data.planets.map(p=>({key:p.key,label:{ru:planetName(p.key),en:planetName(p.key)},longitude:p.longitude,retrograde:p.speed<0,house:houseNumber(p.longitude,data.cusps)??undefined}))}],
  aspects:chartAspects(data.planets).map(a=>({id:`${a.a}-${a.b}`,from:{layer:'natal',planet:a.a},to:{layer:'natal',planet:a.b},label:{ru:aspectName(a.definition.key)||a.definition.key,en:aspectName(a.definition.key)||a.definition.key},angle:a.definition.angle,orb:a.orb,tone:a.definition.tone})),
 }
 return <ComparisonWheel className="ep-natal-wheel" compact={compact} result={result} selected={selected?`natal:${selected}`:''} showAspects={showAspects} onSelect={id=>onSelect(id.slice('natal:'.length) as PlanetKey)}/>
}

export function ChartPreview({data}:{data:NatalChartData}){return <div className="co-chart-preview" aria-hidden="true" inert><NatalWheel data={data} selected={null} showAspects compact onSelect={()=>{}}/></div>}
