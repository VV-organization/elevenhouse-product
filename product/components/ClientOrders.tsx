import {useState} from 'react'
import {tr,localeTag} from '../i18n'
import {useModuleState,money} from '../modules/ModuleKit'
import {orderStatusLabel} from '../modules/portal-orders'
import type {PortalOrder} from '../modules/portal-order-model'
import type {Practice} from '../state/model'

export function ClientOrders({practice,clientId,onOpen}:{practice:Practice;clientId:string;onOpen:(id:string)=>void}){
 const [orders]=useModuleState<PortalOrder[]>('client-orders',practice.isExample,()=>[])
 const [limit,setLimit]=useState(5)
 const own=orders.filter(o=>o.clientId===clientId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
 if(!own.length)return null
 return <section className="ep-section"><div className="ep-section-heading"><h2>{tr('Заказы клиента','Client orders')}</h2><span>{own.length}</span></div><div className="ex-list">{own.slice(0,limit).map(o=><button key={o.id} className="ex-row ex-row-button" onClick={()=>onOpen(o.id)}><span><strong>{o.title}</strong><small className="ep-muted" style={{display:'block'}}>{new Date(o.createdAt).toLocaleDateString(localeTag())} · {orderStatusLabel(o)}</small></span><strong>{money(o.total)}</strong></button>)}</div>{own.length>limit&&<button className="ep-button" onClick={()=>setLimit(n=>n+5)}>{tr('Показать ещё','Show more')}</button>}</section>
}
