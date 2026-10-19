import {tr} from '../i18n'
import { useEffect, useRef, useId, type ReactNode } from 'react'
import { Icon } from './Icon'
import './context-drawer.css'

export function Dialog({title,children,onClose,wide=false,placement='center',className=''}:{title:string,children:ReactNode,onClose:()=>void,wide?:boolean,placement?:'center'|'drawer',className?:string}) {
  const titleId=useId()
  const ref=useRef<HTMLDialogElement>(null)
  const heading=useRef<HTMLHeadingElement>(null)
  const close=useRef(onClose)
  close.current=onClose
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const dialog=ref.current!
    dialog.showModal();
    const initialFocus=Array.from(dialog.querySelectorAll<HTMLElement>('[data-autofocus],input:not([type="hidden"]),select,textarea')).filter(element=>element.getClientRects().length>0&&!element.matches(':disabled'))
    const target=initialFocus.find(element=>element.hasAttribute('data-autofocus'))||initialFocus[0]||heading.current
    target?.focus({preventScroll:true})
    return ()=>{dialog.close();previous?.focus()}
  },[])
  return <dialog ref={ref} className={`ep-dialog${wide?' ep-dialog--wide':''}${placement==='drawer'?' ep-dialog--drawer':''}${className?' '+className:''}`} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();close.current()}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close.current()}}}>
    <div className="ep-dialog-head"><h2 ref={heading} tabIndex={-1} id={titleId}>{title}</h2><button className="ep-icon-button" onClick={onClose} aria-label={tr("Закрыть","Close")}><Icon name="close"/></button></div>
    {children}
  </dialog>
}
