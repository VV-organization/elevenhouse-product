import type {Practice} from '../state/model'
import type {Payment} from '../modules/ServicesFinance'

/** Calendar month to date, with a shorter previous month explicitly bounded. */
export function monthlyIncomeComparison(payments:Payment[],today:string){
 const currentFrom=today.slice(0,7)+'-01'
 const previousEnd=new Date(currentFrom+'T12:00:00Z')
 previousEnd.setUTCDate(0)
 const previousFrom=previousEnd.toISOString().slice(0,7)+'-01'
 const previousDay=Math.min(Number(today.slice(8)),previousEnd.getUTCDate())
 const previousTo=previousFrom.slice(0,8)+String(previousDay).padStart(2,'0')
 const rows=(from:string,to:string)=>payments.filter(p=>p.status==='paid'&&(p.receivedDate??p.date)>=from&&(p.receivedDate??p.date)<=to)
 const current=rows(currentFrom,today),previous=rows(previousFrom,previousTo)
 const net=(items:Payment[])=>items.reduce((sum,p)=>sum+p.amount-p.commission,0)
 const currentNet=net(current),previousNet=net(previous)
 const sameDays=previousDay===Number(today.slice(8))
 return {from:currentFrom,to:today,previousFrom,previousTo,current,previous,currentNet,previousNet,sameDays,
  change:sameDays&&previousNet>0?(currentNet-previousNet)/previousNet:null}
}

/** Keep every client represented, including unset and unregistered custom stages. */
export function clientStageSummary(practice:Pick<Practice,'clients'|'clientStages'>,labels:string[][]){
 const stages=new Map([...labels,...(practice.clientStages??[]).map(s=>[s.id,s.label])].map(([id,label])=>[id,{id,label,count:0}]))
 for(const client of practice.clients){
  const id=client.stage||''
  const stage=stages.get(id)??{id,label:id,count:0}
  stage.count++;stages.set(id,stage)
 }
 return [...stages.values()]
}
