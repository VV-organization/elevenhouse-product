import {useEffect,useId,useRef,useState,type ReactNode} from 'react'
import {tr} from '../i18n'
import './action-hierarchy.css'

/** A top-layer action list: native buttons keep their normal Tab/Enter behavior. */
export function ActionMenu({children,label=tr('Ещё','More')}:{children:ReactNode;label?:string}){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null)
 const [open,setOpen]=useState(false)
 function close(restore=false){panel.current?.hidePopover();setOpen(false);if(restore)trigger.current?.focus({preventScroll:true})}
 function position(){
  const element=panel.current,button=trigger.current
  if(!element||!button)return
  const rect=button.getBoundingClientRect(),width=Math.min(292,window.innerWidth-24)
  if(rect.bottom<0||rect.top>window.innerHeight){close();return}
  element.style.width=`${width}px`
  element.style.left=`${Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12))}px`
  element.style.maxHeight=`${Math.max(100,window.innerHeight-24)}px`
  const height=element.getBoundingClientRect().height
  element.style.top=`${Math.max(12,Math.min(rect.bottom+8+height<=window.innerHeight-12?rect.bottom+8:rect.top-height-8,window.innerHeight-height-12))}px`
 }
 useEffect(()=>{
  if(!open)return
  let frame=0
  const follow=(event:Event)=>{if(event.target instanceof Node&&panel.current?.contains(event.target))return;cancelAnimationFrame(frame);frame=requestAnimationFrame(position)}
  window.addEventListener('resize',follow)
  window.addEventListener('scroll',follow,true)
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',follow);window.removeEventListener('scroll',follow,true)}
 },[open])
 function show(last=false){
  const element=panel.current,button=trigger.current
  if(!element||!button)return
  if(element.matches(':popover-open')){close(true);return}
  element.showPopover()
  position()
  setOpen(true)
  const items=element.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')
  items[last?items.length-1:0]?.focus({preventScroll:true})
 }
 return <span className="ep-action-menu">
  <button ref={trigger} type="button" className="ep-text-button ep-action-menu-trigger" aria-expanded={open} aria-controls={id} onClick={()=>show()} onKeyDown={e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();show(e.key==='ArrowUp')}}}>{label}<span aria-hidden="true">···</span></button>
  <div ref={panel} id={id} popover="auto" role="group" aria-label={label} className="ep-action-menu-panel" onToggle={e=>setOpen(e.newState==='open')}
   onClickCapture={e=>{if((e.target as HTMLElement).closest('button:not(:disabled),a[href]'))close(true)}}
   onKeyDown={e=>{
    if(e.key==='Escape'){e.preventDefault();close(true);return}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return
    e.preventDefault()
    const items=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')),index=items.indexOf(document.activeElement as HTMLElement)
    const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length
    items[next]?.focus()
   }}>{children}</div>
 </span>
}
