import type {CalculationRequest,CalculationResponse} from './calculationMethods'
export type CalculationLabel={ru:string;en:string}
export type AstroPosition={key:string;label:CalculationLabel;longitude:number;retrograde?:boolean;house?:number}
export type AstroLayer={id:string;label:CalculationLabel;utc:string;positions:AstroPosition[];cusps?:number[];ascendant?:number;midheaven?:number}
export type SuppliedAspect={id:string;from:{layer:string;planet:string};to:{layer:string;planet:string};label:CalculationLabel;angle:number;orb:number;tone:'soft'|'hard'|'neutral';applying?:boolean}
export type AstrologyResult={kind:'astrology';title:CalculationLabel;zodiac:CalculationLabel;houseSystem:string;layers:[AstroLayer]|[AstroLayer,AstroLayer];aspects:SuppliedAspect[];notes?:CalculationLabel[]}
export const hdCentreKeys=['head','ajna','throat','g','heart','spleen','solar','sacral','root'] as const
export type HDCentre=typeof hdCentreKeys[number]
export type HDActivation={planet:string;label:CalculationLabel;gate:number;line:number;side:'personality'|'design'|'transit'}
export type HDChannel={gates:[number,number];label:CalculationLabel;defined:boolean;description?:CalculationLabel}
export type HDResultChart={id:string;label:CalculationLabel;type?:CalculationLabel;profile?:[number,number];authority?:CalculationLabel;strategy?:CalculationLabel;definition?:CalculationLabel;signature?:CalculationLabel;notSelf?:CalculationLabel;centres:Array<{key:HDCentre;defined:boolean}>;channels:HDChannel[];activations:HDActivation[]}
export type HumanDesignResult={kind:'human-design';title:CalculationLabel;charts:HDResultChart[];comparison?:'partnership';notes?:CalculationLabel[]}
export type AstronomyResult=AstrologyResult|HumanDesignResult
export type CalculateAstronomy=(request:CalculationRequest)=>CalculationResponse<AstronomyResult>|Promise<CalculationResponse<AstronomyResult>>
export const hdChannelTopology:number[][]=[[64,47],[61,24],[63,4],[17,62],[43,23],[11,56],[31,7],[8,1],[33,13],[20,10],[45,21],[35,36],[12,22],[16,48],[20,57],[20,34],[2,14],[15,5],[46,29],[10,34],[25,51],[10,57],[40,37],[26,44],[59,6],[34,57],[27,50],[3,60],[42,53],[9,52],[32,54],[28,38],[18,58],[30,41],[55,39],[49,19]]
const degrees=(v:number)=>Number.isFinite(v)&&v>=0&&v<360
const labelValid=(v:CalculationLabel)=>!!v&&typeof v.ru==='string'&&typeof v.en==='string'
const optionalLabel=(v:CalculationLabel|undefined)=>v===undefined||labelValid(v)
const optionalBoolean=(v:boolean|undefined)=>v===undefined||typeof v==='boolean'
const idValid=(v:string)=>typeof v==='string'&&v.length>0
const unique=(ids:string[])=>new Set(ids).size===ids.length
/** Validates presentation data only. It never computes or fills missing astronomical/HD values. */
export function validAstronomyResult(result:AstronomyResult){
 try{
  if(!labelValid(result.title)||result.notes&&!result.notes.every(labelValid))return false
  if(result.kind==='astrology')return labelValid(result.zodiac)&&typeof result.houseSystem==='string'&&result.layers.length>=1&&result.layers.length<=2&&unique(result.layers.map(l=>l.id))&&result.layers.every(l=>idValid(l.id)&&labelValid(l.label)&&typeof l.utc==='string'&&Number.isFinite(Date.parse(l.utc))&&l.positions.length>0&&unique(l.positions.map(p=>p.key))&&l.positions.every(p=>idValid(p.key)&&labelValid(p.label)&&degrees(p.longitude)&&optionalBoolean(p.retrograde)&&(p.house===undefined||Number.isInteger(p.house)&&p.house>=1&&p.house<=12))&&(l.cusps===undefined||l.cusps.length===12&&l.cusps.every(degrees))&&(l.ascendant===undefined||degrees(l.ascendant))&&(l.midheaven===undefined||degrees(l.midheaven)))&&unique(result.aspects.map(a=>a.id))&&result.aspects.every(a=>idValid(a.id)&&labelValid(a.label)&&['soft','hard','neutral'].includes(a.tone)&&optionalBoolean(a.applying)&&result.layers.some(l=>l.id===a.from.layer&&l.positions.some(p=>p.key===a.from.planet))&&result.layers.some(l=>l.id===a.to.layer&&l.positions.some(p=>p.key===a.to.planet))&&Number.isFinite(a.orb)&&a.orb>=0&&Number.isFinite(a.angle)&&a.angle>=0&&a.angle<=180)
  if(result.kind==='human-design')return result.charts.length>0&&unique(result.charts.map(c=>c.id))&&result.charts.every(c=>idValid(c.id)&&labelValid(c.label)&&[c.type,c.authority,c.strategy,c.definition,c.signature,c.notSelf].every(optionalLabel)&&c.centres.length===9&&unique(c.centres.map(x=>x.key))&&c.centres.every(x=>hdCentreKeys.includes(x.key)&&typeof x.defined==='boolean')&&(!c.profile||c.profile.length===2&&c.profile.every(n=>Number.isInteger(n)&&n>=1&&n<=6))&&unique(c.channels.map(ch=>[...ch.gates].sort((a,b)=>a-b).join('-')))&&c.channels.every(ch=>ch.gates.length===2&&ch.gates[0]!==ch.gates[1]&&hdChannelTopology.some(pair=>pair.includes(ch.gates[0])&&pair.includes(ch.gates[1]))&&labelValid(ch.label)&&optionalLabel(ch.description)&&typeof ch.defined==='boolean')&&c.activations.every(a=>idValid(a.planet)&&labelValid(a.label)&&['personality','design','transit'].includes(a.side)&&Number.isInteger(a.gate)&&a.gate>=1&&a.gate<=64&&Number.isInteger(a.line)&&a.line>=1&&a.line<=6))
  return false
 }catch{return false}
}
/** Callback adapters may reconstruct objects in a different property order. */
export function sameCalculationRequest(a:CalculationRequest,b:CalculationRequest){
 const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)])):value
 return JSON.stringify(canonical(a))===JSON.stringify(canonical(b))
}

const hdGateCentres:Record<number,HDCentre>={"64":"head","61":"head","63":"head","47":"ajna","24":"ajna","4":"ajna","17":"ajna","43":"ajna","11":"ajna","62":"throat","23":"throat","56":"throat","16":"throat","20":"throat","35":"throat","12":"throat","45":"throat","31":"throat","8":"throat","33":"throat","1":"g","7":"g","13":"g","10":"g","25":"g","15":"g","46":"g","2":"g","21":"heart","51":"heart","26":"heart","40":"heart","48":"spleen","57":"spleen","44":"spleen","50":"spleen","32":"spleen","28":"spleen","18":"spleen","36":"solar","22":"solar","37":"solar","6":"solar","49":"solar","55":"solar","30":"solar","5":"sacral","14":"sacral","29":"sacral","34":"sacral","27":"sacral","59":"sacral","42":"sacral","3":"sacral","9":"sacral","53":"root","60":"root","52":"root","54":"root","38":"root","58":"root","19":"root","39":"root","41":"root"}
export function compareHDCharts(a:HDResultChart,b:HDResultChart){
 const own=new Set(a.activations.filter(p=>p.side!=='transit').map(p=>p.gate)),other=new Set(b.activations.filter(p=>p.side!=='transit').map(p=>p.gate))
 const groups:{common:number[][];electro:number[][];compromise:number[][];aOnly:number[][];bOnly:number[][]}={common:[],electro:[],compromise:[],aOnly:[],bOnly:[]},together=new Set<HDCentre>()
 hdChannelTopology.forEach(pair=>{const [x,y]=pair,a0=own.has(x),a1=own.has(y),b0=other.has(x),b1=other.has(y),af=a0&&a1,bf=b0&&b1
  if(af&&bf)groups.common.push(pair);else if(af&&(b0||b1)||bf&&(a0||a1))groups.compromise.push(pair);else if(af)groups.aOnly.push(pair);else if(bf)groups.bOnly.push(pair);else if(a0&&b1||a1&&b0)groups.electro.push(pair)
  if((a0||b0)&&(a1||b1)){together.add(hdGateCentres[x]);together.add(hdGateCentres[y])}
 })
 return {...groups,togetherCentres:together.size}
}
/** Composite connectivity is derived only from supplied gates; it does not calculate a new personal type/profile. */
export function combinedHDCharts(a:HDResultChart,b:HDResultChart):HDResultChart{
 const activations=[...a.activations.map(x=>({...x,label:{ru:`${a.label.ru} · ${x.label.ru}`,en:`${a.label.en} · ${x.label.en}`}})),...b.activations.map(x=>({...x,label:{ru:`${b.label.ru} · ${x.label.ru}`,en:`${b.label.en} · ${x.label.en}`}}))],gates=new Set(activations.filter(x=>x.side!=='transit').map(x=>x.gate)),defined=new Set<HDCentre>()
 const channels:HDChannel[]=hdChannelTopology.filter(pair=>pair.every(g=>gates.has(g))).map(pair=>{pair.forEach(g=>defined.add(hdGateCentres[g]));const original=[...a.channels,...b.channels].find(ch=>pair.every(g=>ch.gates.includes(g)));return {gates:[pair[0],pair[1]],label:original?.label||{ru:`Канал ${pair.join('–')}`,en:`Channel ${pair.join('–')}`},defined:true,description:original?.description}})
 return {id:`combined:${a.id}:${b.id}`,label:{ru:'Общий бодиграф пары',en:'Combined partnership bodygraph'},centres:hdCentreKeys.map(key=>({key,defined:defined.has(key)})),channels,activations}
}
