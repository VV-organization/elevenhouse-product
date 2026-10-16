import {tr} from '../i18n'
import {useId,useState} from 'react'
import {AstroSymbol} from './AstroSymbol'
import './chart.css'
const getPlanets=()=>[['sun',tr('Солнце','Sun'),353.9],['moon',tr('Луна','Moon'),38.2],['mercury',tr('Меркурий','Mercury'),335.5],['venus',tr('Венера','Venus'),328.03],['mars',tr('Марс','Mars'),282.75],['jupiter',tr('Юпитер','Jupiter'),90.3],['saturn',tr('Сатурн','Saturn'),293.17],['uranus',tr('Уран','Uranus'),278.67],['neptune',tr('Нептун','Neptune'),283.92],['pluto',tr('Плутон','Pluto'),227.33]] as const
const signKeys=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
const getSigns=()=>[tr('Овен','Aries'),tr('Телец','Taurus'),tr('Близнецы','Gemini'),tr('Рак','Cancer'),tr('Лев','Leo'),tr('Дева','Virgo'),tr('Весы','Libra'),tr('Скорпион','Scorpio'),tr('Стрелец','Sagittarius'),tr('Козерог','Capricorn'),tr('Водолей','Aquarius'),tr('Рыбы','Pisces')]
function point(angle:number,r:number){const a=(angle+145)*Math.PI/180;return {x:240+Math.cos(a)*r,y:240-Math.sin(a)*r}}
function positions(planets:ReturnType<typeof getPlanets>){
 const placed:{x:number,y:number,index:number}[]=[]
 planets.map((p,index)=>({angle:p[2],index})).sort((a,b)=>a.angle-b.angle).forEach(({angle,index})=>{
  const p=[158,126,94].map(r=>point(angle,r)).find(p=>placed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=29))||point(angle,94)
  placed.push({...p,index})
 })
 return planets.map((_,index)=>placed.find(p=>p.index===index)!)
}
function arc(start:number,end:number,r:number){const a=point(start,r),b=point(end,r);return `M${a.x} ${a.y}A${r} ${r} 0 0 0 ${b.x} ${b.y}`}
export function Chart(){
 const artworkId=useId().replace(/:/g,'')
 const planets=getPlanets(),signs=getSigns(),markers=positions(planets)
 const [selected,setSelected]=useState(0)
 const active=planets[selected],signIndex=Math.floor(active[2]/30)
 return <section className="ep-natal" aria-label={tr('Натальная карта','Natal chart')}>
  <h2>{tr('Натальная карта','Natal chart')}</h2>
  <div className="ep-natal-layout">
   <svg className="ep-natal-wheel" viewBox="0 0 480 480" role="img" aria-label={tr(`Натальная карта. Выбрано: ${active[1]}. Положения доступны в списке планет.`,`Natal chart. Selected: ${active[1]}. Positions are available in the planet list.`)}>
    <defs><radialGradient id={`${artworkId}-paper`} cx="44%" cy="38%" r="66%"><stop offset="0%" className="ep-natal-tone-center"/><stop offset="100%" className="ep-natal-tone-edge"/></radialGradient></defs>
    <circle cx="240" cy="240" r="218" className="ep-natal-paper" fill={`url(#${artworkId}-paper)`}/>
    <path d={arc(signIndex*30+2,signIndex*30+28,216)} className="ep-natal-selected-arc"/>
    <circle cx="240" cy="240" r="180" className="ep-natal-ring"/>

    {Array.from({length:72},(_,i)=>{const a=point(i*5,180),b=point(i*5,i%6===0?190:183);return <path key={i} d={`M${a.x} ${a.y}L${b.x} ${b.y}`} className={i%6===0?"ep-natal-tick ep-natal-tick--major":"ep-natal-tick"}/>})}
    {signs.map((name,i)=>{const p=point(i*30+15,199);return <g key={signKeys[i]} className={i===signIndex?'ep-natal-sign is-selected':'ep-natal-sign'}><title>{name}</title><AstroSymbol name={signKeys[i]} x={p.x-12} y={p.y-12} width="24" height="24"/></g>})}
    {planets.map(([key,name,angle],i)=>{const p=markers[i],edge=point(angle,178),tick=point(angle,169);return <g key={key} className={i===selected?'ep-natal-marker is-selected':'ep-natal-marker'}><title>{name}</title><path d={`M${edge.x} ${edge.y}L${tick.x} ${tick.y}`} className="ep-natal-leader"/><circle cx={edge.x} cy={edge.y} r="2" fill="currentColor"/><circle cx={p.x} cy={p.y} r="14" className="ep-natal-marker-bg"/><AstroSymbol name={key} x={p.x-10} y={p.y-10} width="20" height="20"/></g>})}
    <g key={active[0]} className="ep-natal-center"><AstroSymbol name={active[0]} x="222" y="187" width="36" height="36"/><text x="240" y="255" textAnchor="middle" className="ep-natal-name">{active[1]}</text><text x="240" y="279" textAnchor="middle" className="ep-natal-position">{Math.floor(active[2]%30)}° · {signs[signIndex]}</text></g>
   </svg>
   <div className="ep-natal-positions" role="group" aria-label={tr('Положения планет','Planet positions')}>
    <div className="ep-natal-columns" aria-hidden="true"><span>{tr('Планета','Planet')}</span><span>{tr('Градус','Degree')}</span><span>{tr('Знак','Sign')}</span></div>
    {planets.map(([key,name,angle],i)=><button type="button" key={key} className="ep-natal-row" aria-pressed={selected===i} onClick={()=>setSelected(i)}><span className="ep-natal-planet"><AstroSymbol name={key} width="22" height="22"/><span>{name}</span></span><span className="ep-natal-degree">{Math.floor(angle%30)}°</span><span className="ep-natal-zodiac">{signs[Math.floor(angle/30)]}</span></button>)}
   </div>
  </div>
 </section>
}
