import {useEffect,useRef,useState} from 'react'
import {tr} from '../i18n'
import {updatePopupDelivery,type PopupEvent,type PopupDelivery} from '../state/event-notifications'
import {Icon} from './Icon'
import './event-toasts.css'

export function EventToasts({entries,read,onRead}:{entries:PopupEvent[];read:string[];onRead:(id:string)=>void;example:boolean}){
 const [delivery,setDelivery]=useState<PopupDelivery|null>(null)
 const stack=useRef<HTMLElement>(null)
 const [compact,setCompact]=useState(()=>typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 600px), (max-height: 600px)').matches)
 useEffect(()=>{const media=window.matchMedia('(max-width: 600px), (max-height: 600px)');const change=()=>setCompact(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[])
 useEffect(()=>{setDelivery(old=>updatePopupDelivery(entries,old,read))},[entries,read,setDelivery])
 const [hovered,setHovered]=useState(false),[focused,setFocused]=useState(false)
 const pending=delivery?.pending??[]
 const visible=pending.map(id=>entries.find(e=>e.id===id&&e.popup&&!read.includes(id))).filter((e):e is PopupEvent=>!!e).slice(0,compact?1:2)
 const remove=(id:string)=>setDelivery(old=>old?{...old,pending:old.pending.filter(item=>item!==id)}:old)
 const visibleKey=visible.map(event=>event.id).join('\0')
 useEffect(()=>{
  if(!visibleKey||hovered||focused)return
  const ids=visibleKey.split('\0')
  const timer=window.setTimeout(()=>setDelivery(old=>old?{...old,pending:old.pending.filter(id=>!ids.includes(id))}:old),8000)
  return()=>window.clearTimeout(timer)
 },[visibleKey,hovered,focused])
 function dismiss(id:string){
  const hadFocus=stack.current?.contains(document.activeElement)
  remove(id)
  if(hadFocus)requestAnimationFrame(()=>{const target=stack.current?.querySelector<HTMLButtonElement>('button')??document.querySelector<HTMLElement>('.wu-notifications');target?.focus({preventScroll:true})})
 }
 return <aside ref={stack} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(false)}} className="eh-event-stack" aria-label={tr('Новые события','New events')}>
  <div className="ep-sr-only" role="status" aria-atomic="true">{visible.length?`${tr('Новых уведомлений','New notifications')}: ${visible.length}. ${visible.map(e=>e.kind==='payments'?tr('Оплата отмечена','Payment recorded'):tr('Новое сообщение','New message')).join('. ')}`:''}</div>
  {visible.map(event=><article key={event.id} className={`eh-event-card eh-event-card--${event.kind}`}>
   <span className="eh-event-icon"><Icon name={event.kind==='payments'?'wallet':'message'} size={20}/></span>
   <div className="eh-event-content"><h2>{event.kind==='payments'?tr('Оплата отмечена','Payment recorded'):tr('Новое сообщение','New message')}</h2><strong>{event.title}</strong><p>{event.detail}</p><button type="button" className="eh-event-open" onClick={()=>{remove(event.id);onRead(event.id);event.open()}}>{event.kind==='payments'?tr('Открыть оплату','Open payment'):tr('Открыть сообщение','Open message')}<Icon name="arrow" size={16}/></button></div>
   <button type="button" className="eh-event-close" aria-label={`${tr('Закрыть уведомление','Dismiss notification')}: ${event.title}`} onClick={()=>dismiss(event.id)}><Icon name="close" size={16}/></button>
  </article>)}
 </aside>
}
