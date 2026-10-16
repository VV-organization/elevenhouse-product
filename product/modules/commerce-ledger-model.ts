import type {Payment,Service} from './ServicesFinance'
import type {PortalOrder} from './portal-order-model'
import type {MoneyDraft} from '../state/commerce-model'
export type PayoutMethod={type:'card'|'business'|'sbp';recipient:string;cardLast4?:string;account?:string;bank?:string;phone?:string}
export type WalletSnapshot={available:number|null;pending:number|null;held:number|null;feePercent:number|null;updatedAt?:string}
export const unknownWallet=():WalletSnapshot=>({available:null,pending:null,held:null,feePercent:null})
export function payoutMethodError(method:PayoutMethod){if(!method.recipient.trim())return 'recipient';if(method.type==='card'&&!/^\d{4}$/.test(method.cardLast4||''))return 'card';if(method.type==='business'&&(!/^\d{20}$/.test((method.account||'').replace(/\s/g,''))||!method.bank?.trim()))return 'business';if(method.type==='sbp'&&(!/^\+?[\d ()-]{10,20}$/.test(method.phone||'')||!method.bank?.trim()))return 'sbp';return ''}
export function payoutDestination(m:PayoutMethod){return m.type==='card'?`${m.recipient} · •••• ${m.cardLast4}`:m.type==='business'?`${m.recipient} · ${m.bank} · ${m.account}`:`${m.recipient} · ${m.bank} · ${m.phone}`}
export function payoutSummary(amount:number,wallet:WalletSnapshot){return {exceeds:wallet.available!==null&&amount>wallet.available,fee:wallet.feePercent===null?null:Math.round(amount*wallet.feePercent/100),net:wallet.feePercent===null?null:amount-Math.round(amount*wallet.feePercent/100)}}
export type LedgerType='order'|'subscription'|'payout'|'refund'
export type LedgerRow={id:string;type:LedgerType;date:string;amount:number;status:'paid'|'pending'|'refunded'|'prepared'|'cancelled';title:string;clientId?:string;paymentId?:string;draftId?:string;details?:string;actual:boolean}
export function financeLedger(payments:Payment[],drafts:MoneyDraft[],orders:PortalOrder[],_services:Service[],supplied:LedgerRow[]=[]):LedgerRow[]{
 const receipts:LedgerRow[]=payments.map(p=>{const order=orders.find(o=>o.id===p.orderId&&o.clientId===p.clientId);return {id:`payment:${p.id}`,paymentId:p.id,type:p.status==='refunded'?'refund':order?.commerce.sale==='subscription'||(!order&&p.kind==='subscription')?'subscription':'order',date:p.receivedDate??p.date,amount:p.status==='refunded'?-p.amount:p.amount,status:p.status,title:p.serviceName,clientId:p.clientId,actual:p.status==='paid'||p.status==='refunded'}})
 return [...receipts.filter(r=>!supplied.some(s=>s.actual&&s.paymentId===r.paymentId&&s.type===r.type)),...supplied,...drafts.map(d=>({id:`request:${d.id}`,draftId:d.id,paymentId:d.paymentId,type:d.kind,date:d.createdAt.slice(0,10),amount:-d.amount,status:d.status,title:d.destination||d.paymentId||'',details:d.reason,actual:false} as LedgerRow))].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))
}
