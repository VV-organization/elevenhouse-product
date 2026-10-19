import type {Payment} from './ServicesFinance'

/** Uses the already selected reporting period; cancelled/refunded orders never contribute. */
export function serviceIncomeSummary(payments:Payment[]){
 const grouped=new Map<string,{id:string;name:string;count:number;amount:number}>()
 for(const payment of payments){
  if(payment.status!=='paid')continue
  const row=grouped.get(payment.serviceId)||{id:payment.serviceId,name:payment.serviceName,count:0,amount:0}
  row.count+=1;row.amount+=payment.amount-payment.commission;grouped.set(row.id,row)
 }
 const rows=[...grouped.values()].sort((a,b)=>b.amount-a.amount||a.id.localeCompare(b.id))
 const total=rows.reduce((sum,row)=>sum+row.amount,0),highest=rows[0]?.amount||0
 return rows.map(row=>({...row,share:total>0&&row.amount>=0?row.amount/total*100:null,leading:row.amount>0&&row.amount===highest}))
}
