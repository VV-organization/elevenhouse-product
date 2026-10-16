export type SaleType = 'once'|'pack'|'subscription'|'free'
export type DeliveryFormat = 'video'|'audio'|'chat'|'text'|'file'|'channel'
export type CommerceConfig = {
 sale:SaleType; packCount:number; packDiscount:number; unitPrice:number; period:'week'|'month'|'year'; trialDays:number
 formats:DeliveryFormat[]; timing:'live'|'async'|'instant'; deadlineDays:number; scope:string
 audience:'solo'|'group'|'gift'; capacity:number; methods:string[]; inputs:string[]; access:string[]
 extras:{id:string;name:string;price:number;kind:'fixed'|'percent'|'included'}[]; coverUrl:string; videoUrl:string
}
export function commerceDefaults(price=5000):CommerceConfig{return {sale:'once',packCount:3,packDiscount:0,unitPrice:price,period:'month',trialDays:0,formats:['video'],timing:'live',deadlineDays:3,scope:'',audience:'solo',capacity:6,methods:[],inputs:[],access:[],extras:[],coverUrl:'',videoUrl:''}}
export function normalizeCommerce(value:Partial<CommerceConfig>|undefined,price:number):CommerceConfig{return {...commerceDefaults(price),...value}}
export function commercePrice(config:CommerceConfig,price:number){return config.sale==='free'?0:config.sale==='pack'?Math.round(config.unitPrice*config.packCount*(100-config.packDiscount)/100):price}
export function commerceError(config:CommerceConfig):string|undefined{
 if(!config.formats.length)return 'formats'
 if(config.sale==='pack'&&(!Number.isInteger(config.packCount)||config.packCount<2||config.packCount>100||!Number.isInteger(config.unitPrice)||config.unitPrice<0||!Number.isFinite(config.packDiscount)||config.packDiscount<0||config.packDiscount>100))return 'pack'
 if(config.sale==='subscription'&&(!Number.isInteger(config.trialDays)||config.trialDays<0||config.trialDays>365))return 'trial'
 if(config.timing==='async'&&(!Number.isInteger(config.deadlineDays)||config.deadlineDays<1||config.deadlineDays>365))return 'deadline'
 if(config.audience==='group'&&(!Number.isInteger(config.capacity)||config.capacity<2||config.capacity>1000))return 'capacity'
 if(config.extras.some(x=>!x.name.trim()||!Number.isFinite(x.price)||x.price<0||(x.kind==='percent'&&x.price>100)))return 'extras'
 for(const value of [config.coverUrl,config.videoUrl])if(value){try{if(!['https:','http:'].includes(new URL(value).protocol))return 'url'}catch{return 'url'}}
}
export type DateRange={from:string;to:string}
export function validDate(value:string){const d=new Date(`${value}T12:00:00Z`);return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value}
export function validRange(range:DateRange){return validDate(range.from)&&validDate(range.to)&&range.from<=range.to}
export function previousRange(range:DateRange):DateRange{if(!validRange(range))throw new Error('Invalid range');const end=new Date(`${range.from}T12:00:00Z`),days=Math.round((Date.parse(range.to)-Date.parse(range.from))/86400000)+1;end.setUTCDate(end.getUTCDate()-1);const start=new Date(end);start.setUTCDate(start.getUTCDate()-days+1);return {from:start.toISOString().slice(0,10),to:end.toISOString().slice(0,10)}}
export function csvCell(value:unknown){let text=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"'}
export function csvDocument(rows:unknown[][]){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n')}
export type MoneyDraft={payoutMethod?:import('../modules/commerce-ledger-model').PayoutMethod;id:string;kind:'payout'|'refund';paymentId?:string;amount:number;destination:string;reason:string;createdAt:string;status:'prepared'|'cancelled'}
export function moneyDraftError(draft:Pick<MoneyDraft,'kind'|'amount'|'paymentId'|'destination'|'reason'>,limit:number|null,existing:MoneyDraft[]){
 if(!Number.isInteger(draft.amount)||draft.amount<=0)return 'amount'
 if(limit!==null&&draft.amount>limit)return 'limit'
 if(draft.kind==='refund'&&(!draft.paymentId||!draft.reason.trim()))return 'reason'
 if(draft.kind==='payout'&&!draft.destination.trim())return 'destination'
 if(draft.kind==='refund'&&existing.some(x=>x.kind==='refund'&&x.paymentId===draft.paymentId&&x.status==='prepared'))return 'duplicate'
}
