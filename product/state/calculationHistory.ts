export type SavedCalculation={at:string;result:unknown}
export type CalculationHistoryItem=SavedCalculation&{key:string;method:'numbers'|'matrix';view:string;year:number;clientId:string}
export function calculationHistory(records:Record<string,SavedCalculation>,clientId:string,method:'numbers'|'matrix'):CalculationHistoryItem[]{
 const prefix=`${clientId}:${method}:`
 return Object.entries(records).filter(([key,value])=>key.startsWith(prefix)&&value&&typeof value.at==='string'&&value.result&&typeof value.result==='object').map(([key,value])=>{const [view,year]=key.slice(prefix.length).split(':');return {...value,key,clientId,method,view,year:Number(year)}}).sort((a,b)=>b.at.localeCompare(a.at))
}
export function astroPublicationDraft(event:{id:string;title:string;description:string;date:string;time:string},zone:string,id:string,now:string){return {post:{id,title:event.title,text:event.description,date:event.date,time:event.time||'10:00',zone,status:'draft',mode:'draft' as const,audience:'public' as const,channels:['portal' as const],media:[],eventId:event.id,updatedAt:now},schedule:false}}
export function reassignMethodCalculation(records:Record<string,SavedCalculation>,key:string,clientId:string){const existing=records[key],marker=key.match(/:(numbers|matrix):/);if(!existing||!marker||!clientId)throw new Error('Unknown calculation');const nextKey=clientId+key.slice(marker.index!),next={...records};if(nextKey!==key&&next[nextKey])throw new Error('Destination exists');delete next[key];next[nextKey]=existing;return {records:next,key:nextKey}}
