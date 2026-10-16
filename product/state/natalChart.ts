// Rendering contract: longitude is tropical ecliptic longitude in degrees.
// The production calculation service supplies this data; this module is not an ephemeris.
export type PlanetKey='sun'|'moon'|'mercury'|'venus'|'mars'|'jupiter'|'saturn'|'uranus'|'neptune'|'pluto'
export type NatalPlanet={key:PlanetKey;longitude:number;speed:number}
export type NatalChartData={planets:readonly NatalPlanet[];cusps:readonly number[];ascendant:number;midheaven:number;houseSystem:string;zodiac:'tropical';utc:string;latitude:number;longitude:number}
export const norm=(value:number)=>((value%360)+360)%360
export function chartPoint(longitude:number,radius:number,ascendant:number){const angle=(180+longitude-ascendant)*Math.PI/180;return {x:320+Math.cos(angle)*radius,y:320-Math.sin(angle)*radius}}
export function zodiacPosition(longitude:number){const minutes=Math.round(norm(longitude)*60)%(360*60);return {sign:Math.floor(minutes/1800),text:`${Math.floor(minutes%1800/60)}°${String(minutes%60).padStart(2,'0')}′`}}
export function houseNumber(longitude:number,cusps:readonly number[]){if(cusps.length!==12)return null;return cusps.findIndex((start,i)=>norm(longitude-start)<norm(cusps[(i+1)%12]-start))+1||null}
export const aspectDefinitions=[{key:'conjunction',angle:0,orb:8,symbol:'☌',tone:'neutral'},{key:'sextile',angle:60,orb:5,symbol:'⚹',tone:'soft'},{key:'square',angle:90,orb:6,symbol:'□',tone:'hard'},{key:'trine',angle:120,orb:7,symbol:'△',tone:'soft'},{key:'opposition',angle:180,orb:7,symbol:'☍',tone:'hard'}] as const
export type NatalAspect={a:PlanetKey;b:PlanetKey;definition:typeof aspectDefinitions[number];orb:number}
export function chartAspects(planets:readonly NatalPlanet[]):NatalAspect[]{return planets.flatMap((a,i)=>planets.slice(i+1).flatMap(b=>{const separation=Math.abs(norm(a.longitude-b.longitude+180)-180);const definition=aspectDefinitions.find(d=>Math.abs(separation-d.angle)<=d.orb);return definition?[{a:a.key,b:b.key,definition,orb:Math.abs(separation-definition.angle)}]:[]}))}
// Shift only glyph labels, never actual positions, cusps or aspect endpoints.
// Start after the largest empty arc so a cluster across 0° remains together.
export function labelLongitudes(planets:readonly NatalPlanet[],gap=12){
 const sorted=planets.map(p=>({key:p.key,value:norm(p.longitude)})).sort((a,b)=>a.value-b.value)
 if(!sorted.length)return {} as Record<PlanetKey,number>
 let start=0,biggest=-1
 sorted.forEach((p,i)=>{const space=norm(sorted[(i+1)%sorted.length].value-p.value);if(space>biggest){biggest=space;start=(i+1)%sorted.length}})
 const ordered=[...sorted.slice(start),...sorted.slice(0,start)].map((p,i,array)=>({...p,value:p.value+(i&&p.value<array[0].value?360:0)}))
 const adjusted=ordered.map(p=>p.value)
 for(let i=1;i<adjusted.length;i++)adjusted[i]=Math.max(adjusted[i],adjusted[i-1]+gap)
 const shift=adjusted.reduce((total,value,i)=>total+value-ordered[i].value,0)/adjusted.length
 return Object.fromEntries(ordered.map((p,i)=>[p.key,norm(adjusted[i]-shift)])) as Record<PlanetKey,number>
}
