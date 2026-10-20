import {useId,useMemo} from 'react'
import {tr} from '../i18n'
import {norm,zodiacPosition} from '../state/natalChart'
import type {AstrologyResult} from '../state/calculationPresentation'
import {AstroSymbol} from './AstroSymbol'
import {wheelLabels,wheelDegreeLabels} from './wheel-layout'
import './comparison-wheel.css'

const signKeys=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
const knownPlanets=new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'])
const signNames=()=>[tr('Овен','Aries'),tr('Телец','Taurus'),tr('Близнецы','Gemini'),tr('Рак','Cancer'),tr('Лев','Leo'),tr('Дева','Virgo'),tr('Весы','Libra'),tr('Скорпион','Scorpio'),tr('Стрелец','Sagittarius'),tr('Козерог','Capricorn'),tr('Водолей','Aquarius'),tr('Рыбы','Pisces')]
const position=(longitude:number)=>{const p=zodiacPosition(longitude);return `${p.text} ${signNames()[p.sign]}`}
const point=(longitude:number,r:number,asc:number)=>{const a=(180+longitude-asc)*Math.PI/180;return {x:320+Math.cos(a)*r,y:320-Math.sin(a)*r}}
const segment=(a:{x:number;y:number},b:{x:number;y:number})=>`M${a.x} ${a.y}L${b.x} ${b.y}`
const arc=(start:number,end:number,r:number,asc:number)=>{
 const a=point(start,r,asc),b=point(end,r,asc)
 return `M${a.x} ${a.y}A${r} ${r} 0 ${end-start>180?1:0} 0 ${b.x} ${b.y}`
}

/** Engraved dial. Only glyph labels move; all data markers and aspect ends keep their true longitude. */
export function ComparisonWheel({result,selected,onSelect,showAspects,className='',compact=false}:{result:AstrologyResult;selected:string;onSelect:(id:string)=>void;showAspects:boolean;className?:string;compact?:boolean}){
 const uid=useId().replace(/:/g,''),asc=result.layers[0].ascendant??0,dual=result.layers.length===2
 const radius=(i:number)=>dual?(i?236:178):212
 const anchorRadius=(i:number)=>dual?(i?112:96):136
 const houseRadius=dual?126:159
 const layouts=useMemo(()=>result.layers.map((layer,i)=>wheelLabels(layer,dual?(i?15:18):16).map(({p,display})=>({p,display,id:`${layer.id}:${p.key}`,glyph:point(display,radius(i),asc),degrees:`${zodiacPosition(p.longitude).text}${p.retrograde?' R':''}`}))),[result,asc,dual])
 const degreeLabels=useMemo(()=>dual?wheelDegreeLabels(layouts.flat().map(item=>({id:item.id,...item.glyph,text:item.degrees})),houseRadius+16,9):{},[layouts,dual,houseRadius])
 const active=result.layers.flatMap(layer=>layer.positions.map(p=>({id:`${layer.id}:${p.key}`,p}))).find(p=>p.id===selected)
 const selectedSign=active?Math.floor(norm(active.p.longitude)/30):-1
 const locate=(ref:{layer:string;planet:string})=>{const i=result.layers.findIndex(l=>l.id===ref.layer),p=result.layers[i]?.positions.find(p=>p.key===ref.planet);return p?point(p.longitude,anchorRadius(i),asc):null}
 const axes=[
  ...(result.layers[0].ascendant===undefined?[]:[{name:'ASC',longitude:result.layers[0].ascendant},{name:'DSC',longitude:norm(result.layers[0].ascendant+180)}]),
  ...(result.layers[0].midheaven===undefined?[]:[{name:'MC',longitude:result.layers[0].midheaven},{name:'IC',longitude:norm(result.layers[0].midheaven+180)}]),
 ]
 return <svg className={`ar-wheel aw-dial ${className}${dual?' aw-dial--dual':''}${selected?' has-selection':''}${compact?' aw-dial--compact':''}`} viewBox="-24 -24 688 688" role="group" aria-label={tr('Карта по результату расчёта','Chart from calculation results')}>
  <defs>
   <radialGradient id={`${uid}-depth`} cx="44%" cy="38%" r="68%">
    <stop offset="0" className="aw-depth-light"/><stop offset="1" className="aw-depth-dark"/>
   </radialGradient>
   <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" className="aw-metal-light"/><stop offset=".45" className="aw-metal-mid"/><stop offset="1" className="aw-metal-dark"/>
   </linearGradient>
   <radialGradient id={`${uid}-core`}>
    <stop offset="0" className="aw-core-light"/><stop offset="1" className="aw-core-dark"/>
   </radialGradient>
  </defs>
  <g aria-hidden="true" className="aw-instrument">
   <circle cx="320" cy="320" r="299" fill={`url(#${uid}-depth)`}/>
   <circle className="aw-bezel" cx="320" cy="320" r="299" stroke={`url(#${uid}-metal)`}/>
   <circle className="aw-bezel-inner" cx="320" cy="320" r="304"/>
   <circle className="aw-zodiac-band" cx="320" cy="320" r="274"/>
   <circle className="aw-track" cx="320" cy="320" r="254"/>
   <circle className="aw-core" cx="320" cy="320" r={houseRadius-12} fill={`url(#${uid}-core)`}/>
   <circle className="aw-house-track" cx="320" cy="320" r={houseRadius+12}/>
   <circle className="aw-house-track aw-house-track--inner" cx="320" cy="320" r={houseRadius-12}/>
   {dual&&<circle className="aw-inner-track" cx="320" cy="320" r="207"/>}
   {signKeys.map((key,i)=>{
    const c=point(i*30+15,274,asc),a=point(i*30,258,asc),b=point(i*30,290,asc)
    return <g key={key} className={`aw-sign${selectedSign===i?' is-active':''}`}>
     <path className="aw-sign-arc" d={arc(i*30+3,i*30+27,294,asc)}/>
     <path className="aw-sign-divider" d={segment(a,b)}/>
     <AstroSymbol name={key} x={c.x-12} y={c.y-12} width={24} height={24} strokeWidth={1.35}/>
     <title>{signNames()[i]}</title>
    </g>
   })}
   {Array.from({length:360},(_,i)=>{
    const major=i%10===0,mid=i%5===0
    return <path key={i} className={`aw-degree${major?' aw-degree--major':''}`} d={segment(point(i,major?241:mid?245:249,asc),point(i,252,asc))}/>
   })}
   {result.layers[0].cusps?.map((longitude,i)=><path key={i} className={`aw-house-line${i%3===0?' aw-house-line--angular':''}`} d={segment(point(longitude,houseRadius-11,asc),point(longitude,houseRadius+11,asc))}/>)}
   {result.layers.map((layer,i)=><g key={layer.id} className={`aw-leaders ar-layer-${i}`}>{wheelLabels(layer,dual?(i?15:18):16).map(({p,display})=>{
    const actual=point(p.longitude,anchorRadius(i),asc),bend=point(p.longitude,houseRadius+19,asc),end=point(display,radius(i)-19,asc)
    return <path key={p.key} className={`aw-leader${selected===`${layer.id}:${p.key}`?' is-active':''}`} d={`${segment(actual,bend)}L${end.x} ${end.y}`}/>
   })}</g>)}
  </g>
  <g className="aw-aspects" aria-hidden="true">
   {showAspects&&result.aspects.filter(a=>!selected||`${a.from.layer}:${a.from.planet}`===selected||`${a.to.layer}:${a.to.planet}`===selected).map(a=>{
    const p=locate(a.from),q=locate(a.to)
    return p&&q?<line key={a.id} data-aspect={a.id} className={`ar-aspect ar-aspect-${a.tone}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y}/>:null
   })}
  </g>
  <g aria-hidden="true">{result.layers[0].cusps?.map((longitude,i)=>{
   const next=result.layers[0].cusps![(i+1)%12],c=point(longitude+norm(next-longitude)/2,houseRadius,asc)
   return <text key={i} className="aw-house-number" x={c.x} y={c.y}>{i+1}</text>
  })}</g>
  <g className="aw-axes" aria-hidden="true">{axes.map(axis=>{
   const a=point(axis.longitude,299,asc),b=point(axis.longitude,305,asc),at=point(axis.longitude,314,asc)
   return <g key={axis.name}>
    <path d={segment(a,b)}/>
    <text x={at.x} y={at.y} textAnchor={at.x<40?'end':at.x>600?'start':'middle'}>{axis.name}</text>
   </g>
  })}</g>
  {result.layers.map((layer,i)=><g key={layer.id} className={`ar-layer-${i} aw-planets`}>{layouts[i].map(({p,glyph,id,degrees})=>{
   const actual=point(p.longitude,anchorRadius(i),asc),caption=dual?degreeLabels[id]:{x:glyph.x,y:glyph.y+29}
   return <g key={p.key} className="aw-planet" role="button" tabIndex={compact?-1:0} aria-label={`${tr(layer.label.ru,layer.label.en)} · ${tr(p.label.ru,p.label.en)} · ${position(p.longitude)}${p.retrograde?` · ${tr('Ретроградное движение','Retrograde')}`:''}`} aria-pressed={selected===id} onClick={()=>onSelect(id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(id)}}}>
    <circle className="aw-position" cx={actual.x} cy={actual.y} r="2.5"/>
    <circle className="ar-planet-target" cx={glyph.x} cy={glyph.y} r="18"/>
    <circle className="aw-planet-rim" cx={glyph.x} cy={glyph.y} r="18"/>
    {knownPlanets.has(p.key)?<AstroSymbol name={p.key} x={glyph.x-11} y={glyph.y-11} width={22} height={22} strokeWidth={1.45}/>:p.key==='node'?<path className="aw-node" transform={`translate(${glyph.x-9} ${glyph.y-9})`} d="M3 13V8a6 6 0 0 1 12 0v5M3 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4M15 13a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>:<text className="ar-small-symbol" x={glyph.x} y={glyph.y+4}>{p.key.toUpperCase().slice(0,3)}</text>}
    {!compact&&caption&&<text className="aw-planet-degree" x={caption.x} y={caption.y}>{degrees}</text>}
    <title>{`${tr(p.label.ru,p.label.en)} · ${position(p.longitude)}`}</title>
   </g>
  })}</g>)}
 </svg>
}
