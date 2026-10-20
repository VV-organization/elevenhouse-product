export type PopupEvent={id:string;kind:string;title:string;detail:string;date:string;popup?:boolean;open:()=>void}
/** The first snapshot is history, never a batch of new arrivals. */
export function selectPopupEvents<T extends PopupEvent>(entries:T[],known:Set<string>|null,read:string[],shown:string[]):T[]{
 if(!known)return []
 const excluded=new Set([...read,...shown])
 return entries.filter(e=>e.popup&&!excluded.has(e.id)&&!known.has(e.id)).sort((a,b)=>b.date.localeCompare(a.date))
}
export type PopupDelivery={known:string[];pending:string[]}
/** Keep only a small live batch; excess events remain in the notification centre. */
export function updatePopupDelivery(entries:PopupEvent[],delivery:PopupDelivery|null,read:string[]):PopupDelivery{
 const next=selectPopupEvents(entries,delivery?new Set(delivery.known):null,read,[])
 const eligible=new Set(entries.filter(e=>e.popup&&!read.includes(e.id)).map(e=>e.id))
 const pending=[...new Set([...(delivery?.pending??[]),...next.map(e=>e.id)])].filter(id=>eligible.has(id)).slice(-2)
 const known=[...new Set([...(delivery?.known??[]),...entries.map(e=>e.id)])]
 if(delivery&&known.length===delivery.known.length&&pending.join('\0')===delivery.pending.join('\0'))return delivery
 return {known,pending}
}
