export type PopupEvent={id:string;kind:string;title:string;detail:string;date:string;popup?:boolean;open:()=>void}
/** Initial history is summarized; subsequent renders deliver new eligible IDs only. */
export function selectPopupEvents<T extends PopupEvent>(entries:T[],known:Set<string>|null,read:string[],shown:string[]):T[]{
 const excluded=new Set([...read,...shown])
 const eligible=entries.filter(e=>e.popup&&!excluded.has(e.id)&&(!known||!known.has(e.id))).sort((a,b)=>b.date.localeCompare(a.date))
 if(known)return eligible
 const kinds=new Set<string>()
 return eligible.filter(e=>{if(kinds.has(e.kind))return false;kinds.add(e.kind);return true}).slice(0,2)
}
export type PopupDelivery={known:string[];pending:string[]}
/** Persist both baseline and queue; a hidden/queued card is not a dismissed card. */
export function updatePopupDelivery(entries:PopupEvent[],delivery:PopupDelivery|null,read:string[]):PopupDelivery{
 const next=selectPopupEvents(entries,delivery?new Set(delivery.known):null,read,[])
 const eligible=new Set(entries.filter(e=>e.popup&&!read.includes(e.id)).map(e=>e.id))
 const pending=[...new Set([...(delivery?.pending??[]),...next.map(e=>e.id)])].filter(id=>eligible.has(id)).slice(-20)
 const known=[...new Set([...(delivery?.known??[]),...entries.map(e=>e.id)])]
 if(delivery&&known.length===delivery.known.length&&pending.join('\0')===delivery.pending.join('\0'))return delivery
 return {known,pending}
}
