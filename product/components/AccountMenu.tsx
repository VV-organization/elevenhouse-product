import {tr, LanguageControl, useLocale} from '../i18n'
import {useEffect, useId, useRef, useState} from 'react'
import {Icon} from './Icon'

export function AccountMenu({name,onLogout}:{name:string,onLogout:()=>void}) {
 const {locale}=useLocale()
 const id=useId(), trigger=useRef<HTMLButtonElement>(null), panel=useRef<HTMLDivElement>(null)
 const [open,setOpen]=useState(false)
 const initials=name.split(' ').slice(0,2).map(part=>part[0]).join('').toUpperCase()
 function position(){
  if(!trigger.current||!panel.current)return
  const r=trigger.current.getBoundingClientRect(), width=Math.min(280,window.innerWidth-32)
  const mobile=window.innerWidth<=800
  const above=r.top-24, below=window.innerHeight-r.bottom-24
  const placeBelow=mobile?below>=160||below>=above:above<160&&below>above
  panel.current.style.width=`${width}px`
  panel.current.style.left=`${Math.max(16,Math.min(mobile?r.right-width:r.left,window.innerWidth-width-16))}px`
  panel.current.style.top=placeBelow?`${r.bottom+8}px`:'auto'
  panel.current.style.bottom=placeBelow?'auto':`${window.innerHeight-r.top+8}px`
  panel.current.style.maxHeight=`${Math.max(0,placeBelow?below:above)}px`
 }
 useEffect(()=>{if(!open)return;position();const dismiss=()=>panel.current?.hidePopover();window.addEventListener('resize',position);window.addEventListener('scroll',dismiss);return()=>{window.removeEventListener('resize',position);window.removeEventListener('scroll',dismiss)}},[open,locale])
 return <div className="ep-account-wrap">
  <button ref={trigger} className="ep-account" popoverTarget={id} onClick={position} aria-label={tr(`Меню аккаунта: ${name}`,`Account menu: ${name}`)} aria-expanded={open} aria-controls={id} aria-haspopup="dialog"><span className="ep-account-avatar">{initials}</span><span>{name}<small>{tr('Аккаунт','Account')}</small></span><Icon name="down" size={16}/></button>
  <div ref={panel} id={id} popover="auto" className="ep-account-panel" role="dialog" aria-label={tr('Меню аккаунта','Account menu')} onToggle={e=>setOpen(e.newState==='open')} onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node)&&e.relatedTarget!==trigger.current)panel.current?.hidePopover()}}>
   <a href="#settings" onClick={()=>panel.current?.hidePopover()}><Icon name="settings"/>{tr('Настройки профиля','Profile settings')}</a>
   <LanguageControl/>
   <div className="ep-account-separator"/>
   <button onClick={()=>{panel.current?.hidePopover();onLogout()}}><Icon name="logout"/>{tr('Выйти из аккаунта','Sign out')}</button>
  </div>
 </div>
}
