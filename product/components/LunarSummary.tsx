import {isInternalPreviewLabel,workspaceLabel} from '../state/workspaceLabels'
import {useId} from 'react'
import {tr} from '../i18n'
import moonSurface from '../assets/lunar/moon-champagne-v2.png'
import './celestial-surfaces.css'

type MoonData={phase:string;sign:string;illumination?:number;source:string}

/** Presentation only: illumination and phase always come from the supplied calculation. */
export function LunarSummary({moon,compact=false}:{moon?:MoonData;compact?:boolean}){
 const id=useId().replace(/:/g,'')
 const illumination=moon?.illumination
 const known=illumination!==undefined&&Number.isFinite(illumination)&&illumination>=0&&illumination<=100
 const waxing=!!moon&&/растущ|waxing|первая четверть|first quarter/i.test(moon.phase)
 const waning=!!moon&&/убыва|waning|последняя четверть|last quarter|third quarter/i.test(moon.phase)
 const resolved=known&&(waxing||waning||illumination===0||illumination===100)
 const radius=64,terminator=known?radius*(1-2*illumination/100):0
 const path=`M 80 16 A 64 64 0 0 1 80 144 A ${Math.abs(terminator)} 64 0 0 ${terminator>=0?0:1} 80 16 Z`
 const lightTransform=waning?'translate(160 0) scale(-1 1)':undefined
 return <div className={`eh-lunar${compact?' eh-lunar--compact':''}${moon?'':' is-unavailable'}`}>
  <svg className="eh-lunar-art" viewBox="0 0 160 160" aria-hidden="true" focusable="false">
   <defs>
    <clipPath id={`${id}-disc`}><circle cx="80" cy="80" r={radius}/></clipPath>
    <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.5"/></filter>
    <radialGradient id={`${id}-limb`} cx=".52" cy=".45" r=".56">
     <stop offset=".55" stopColor="#091321" stopOpacity="0"/>
     <stop offset="1" stopColor="#091321" stopOpacity=".1"/>
    </radialGradient>
    <linearGradient id={`${id}-shading`} gradientUnits="userSpaceOnUse" x1={80+terminator} y1="80" x2="144" y2="80">
     <stop stopColor="#10243b" stopOpacity=".8"/>
     <stop offset=".35" stopColor="#22364b" stopOpacity=".36"/>
     <stop offset=".75" stopColor="#eac484" stopOpacity=".06"/>
     <stop offset="1" stopColor="#ffe0a3" stopOpacity=".22"/>
    </linearGradient>
    <filter id={`${id}-earthshine`} colorInterpolationFilters="sRGB">
     <feColorMatrix type="matrix" values=".045 .09 .025 0 0 .09 .18 .05 0 0 .14 .28 .08 0 0 0 0 0 1 0"/>
    </filter>
    <filter id={`${id}-light-haze`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id={`${id}-rim-soft`} x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation=".65"/></filter>
    <mask id={`${id}-phase`} maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160">
     {resolved&&illumination>0&&(illumination===100
      ?<circle cx="80" cy="80" r={radius} fill="white"/>
      :<path d={path} fill="white" filter={`url(#${id}-soft)`} transform={lightTransform}/>)}
    </mask>
    {/* Overscan the texture so its irregular alpha edge stays outside the single disc clip. */}
    <svg id={`${id}-surface`} x="13" y="13" width="134" height="134" viewBox="88 67 1080 1080">
     <image href={moonSurface} width="1280" height="1280"/>
    </svg>
   </defs>
   {/* Blur after the phase mask: light can spill beyond the lit edge into the panel. */}
   {resolved&&illumination>0&&<g filter={`url(#${id}-light-haze)`} opacity=".42"><g mask={`url(#${id}-phase)`}><circle cx="80" cy="80" r="64" fill="#efc57e"/></g></g>}
   {resolved?<g clipPath={`url(#${id}-disc)`}>
    <circle cx="80" cy="80" r={radius} fill="#101e2f"/>
    <use href={`#${id}-surface`} filter={`url(#${id}-earthshine)`} opacity=".46"/>
    <use href={`#${id}-surface`} mask={`url(#${id}-phase)`}/>
    {resolved&&illumination>0&&illumination<100&&<g mask={`url(#${id}-phase)`}><circle cx="80" cy="80" r={radius} fill={`url(#${id}-shading)`} transform={lightTransform}/></g>}
    <circle cx="80" cy="80" r={radius} fill={`url(#${id}-limb)`}/>
    {resolved&&illumination>0&&<g mask={`url(#${id}-phase)`}><circle cx="80" cy="80" r="63.6" fill="none" stroke="#ffe1aa" strokeWidth=".85" opacity=".75" filter={`url(#${id}-rim-soft)`}/></g>}
   </g>:<circle cx="80" cy="80" r={radius} className="eh-lunar-unresolved"/>}
  </svg>
  <div className="eh-lunar-copy">
   <strong className="eh-lunar-phase">{moon?workspaceLabel(moon.phase):tr('Небо сегодня','Sky today')}</strong>
   <span className="eh-lunar-sign">{moon?.sign||tr('Данные ещё не получены','Data has not arrived yet')}</span>
   {known&&<span className="eh-lunar-measure"><b>{illumination}%</b> {tr('освещено','illuminated')}</span>}
   {moon&&!isInternalPreviewLabel(moon.source)&&<small className="eh-lunar-source">{tr('Источник','Source')}: {moon.source}</small>}
  </div>
 </div>
}
