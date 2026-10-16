/** Deterministic methods ported from the supplied numerology-data.jsx and matrix-data.jsx.
 * These are method-specific arithmetic, not an astronomical ephemeris. */
export function dateParts(value:string) {
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
 if(!match)return null
 const [year,month,day]=match.slice(1).map(Number),date=new Date(`${value}T12:00:00Z`)
 return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value?{year,month,day}:null
}
export const digits=(value:string|number)=>String(value).replace(/\D/g,'').split('').reduce((sum,n)=>sum+Number(n),0)
export function reduceNumber(value:number){let n=Math.abs(Math.trunc(value));while(n>9&&![11,22,33].includes(n))n=digits(n);return n}
export function reduceArcana(value:number){let n=Math.abs(Math.trunc(value));while(n>22)n=digits(n);return n||22}
const alphabet=['аисъ','бйты','вкуь','глфэ','дмхю','енця','ёоч','жпш','зрщ']
export function nameNumber(name:string,mode:'all'|'vowel'|'consonant'='all'){
 const letters=name.toLowerCase().replace(/[^а-яё]/g,'').split(''),vowels='аеёиоуыэюя'
 const selected=letters.filter(c=>mode==='all'||(mode==='vowel'?vowels.includes(c):!vowels.includes(c)))
 const total=selected.reduce((sum,c)=>sum+alphabet.findIndex(group=>group.includes(c))+1,0)
 return total?reduceNumber(total):null
}
export const psychoLines=[[1,4,7],[2,5,8],[3,6,9],[1,2,3],[4,5,6],[7,8,9],[1,5,9],[3,5,7]]
export function numerology(date:string,name:string,year:number){
 const d=dateParts(date);if(!d||!Number.isInteger(year)||year<1||year>9999)return null
 const life=reduceNumber(reduceNumber(d.day)+reduceNumber(d.month)+reduceNumber(digits(d.year)))
 const personalYear=reduceNumber(reduceNumber(d.day)+reduceNumber(d.month)+reduceNumber(digits(year)))
 const base=`${d.day}${d.month}${d.year}`.split('').map(Number),n1=base.reduce((a,b)=>a+b,0),n2=digits(n1),n3=Math.abs(n1-2*Number(String(d.day)[0])),n4=digits(n3)
 const work=[n1,n2,n3,n4],counts=Array.from({length:10},()=>0)
 ;[...base,...work.flatMap(n=>String(n).split('').map(Number))].forEach(n=>{if(n)counts[n]++})
 const raw=digits(d.day)+digits(d.month)+digits(d.year)
 return {life,expression:nameNumber(name),soul:nameNumber(name,'vowel'),personality:nameNumber(name,'consonant'),birthday:reduceNumber(d.day),personalYear,months:Array.from({length:12},(_,i)=>reduceNumber(personalYear+i+1)),work,counts,lines:psychoLines.map(line=>line.reduce((sum,n)=>sum+counts[n],0)),debt:[13,14,16,19].includes(raw)?raw:null}
}
export const matrixPointKeys=['A','B','C','D','E','tl','tr','br','bl','A1','B1','C1','D1','tl1','tr1','br1','bl1','earth','sky','male','female','p1','p2','p3'] as const
export type MatrixPoint=typeof matrixPointKeys[number]
export type MatrixPoints=Record<MatrixPoint,number>
const chakraPairs:[MatrixPoint,MatrixPoint][]=[['B','B1'],['tr','tr1'],['C','C1'],['br','br1'],['D','D1'],['bl','bl1'],['A','A1']]
function finishMatrix(p:MatrixPoints){const chakras=chakraPairs.map(([a,b])=>({physical:p[a],energy:p[b],emotion:reduceArcana(p[a]+p[b])})),physical=reduceArcana(chakras.reduce((s,c)=>s+c.physical,0)),energy=reduceArcana(chakras.reduce((s,c)=>s+c.energy,0));return {...p,zones:[p.p1,reduceArcana(p.E+p.br),reduceArcana(p.E+p.bl),reduceArcana(p.E+p.B)],chakras,total:{physical,energy,emotion:reduceArcana(physical+energy)}}}
export function matrix(date:string){const d=dateParts(date);if(!d)return null;const r=reduceArcana,A=r(d.day),B=r(d.month),C=r(digits(d.year)),D=r(A+B+C),E=r(A+B+C+D),tl=r(A+B),tr=r(B+C),br=r(C+D),bl=r(D+A),earth=r(A+C),sky=r(B+D),male=r(tl+br),female=r(tr+bl),p1=r(earth+sky),p2=r(male+female);return finishMatrix({A,B,C,D,E,tl,tr,br,bl,A1:r(A+E),B1:r(B+E),C1:r(C+E),D1:r(D+E),tl1:r(tl+E),tr1:r(tr+E),br1:r(br+E),bl1:r(bl+E),earth,sky,male,female,p1,p2,p3:r(p1+p2)})}
export function compositeMatrix(a:MatrixPoints,b:MatrixPoints){return finishMatrix(Object.fromEntries(matrixPointKeys.map(k=>[k,reduceArcana(a[k]+b[k])])) as MatrixPoints)}
export function matrixYear(date:string,year:number,asOf:string){const d=dateParts(date),now=dateParts(asOf),m=matrix(date);if(!d||!now||!m||!Number.isInteger(year)||year<1||year>9999)return null;const age=Math.max(0,now.year-d.year-(now.month<d.month||(now.month===d.month&&now.day<d.day)?1:0)),order:MatrixPoint[]=['A','tl','B','tr','C','br','D','bl'],agePoint=order[Math.floor(age%80/10)],personalYear=reduceArcana(d.day+d.month+digits(year));return {age,agePoint,ageArcana:m[agePoint],personalYear,challenge:reduceArcana(personalYear+m.E),resource:reduceArcana(personalYear+m.A)}}
export const astrologyModes=['natal','transits','progress','directions','return','synastry','composite','solar','child'] as const
export type AstrologyMode=typeof astrologyModes[number]
export type CalculationRequest={method:'astrology'|'human-design';mode:string;birth:{date:string;time:string;place:string;unknownTime:boolean};partner?:{date:string;time:string;place:string;unknownTime:boolean};targetDate:string;targetPlace:string;houseSystem:string;nodes:'mean'|'true';minorAspects:boolean;orbMultiplier:number;returnPlanet?:string;subjectName?:string}
/** Integration boundary. A pending request is never a fabricated successful result. */
export type CalculationResponse<T>={status:'ready';request:CalculationRequest;result:T}|{status:'unavailable'|'error';request:CalculationRequest;message:string}
