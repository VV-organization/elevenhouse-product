import {tr} from '../i18n'
import { useEffect, useRef, useId, type ReactNode } from 'react'
import { Icon } from './Icon'

export function Dialog({title,children,onClose,wide=false}:{title:string,children:ReactNode,onClose:()=>void,wide?:boolean}) {
  const titleId=useId()
  const ref=useRef<HTMLDialogElement>(null)
  const close=useRef(onClose)
  close.current=onClose
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const dialog=ref.current!
    dialog.showModal();
    (dialog.querySelector<HTMLElement>('[data-autofocus]')||dialog.querySelector<HTMLElement>('input:not([type="hidden"]),select,textarea'))?.focus()
    return ()=>{dialog.close();previous?.focus()}
  },[])
  return <dialog ref={ref} className={`ep-dialog${wide?' ep-dialog--wide':''}`} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();close.current()}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close.current()}}}>
    <div className="ep-dialog-head"><h2 id={titleId}>{title}</h2><button className="ep-icon-button" onClick={onClose} aria-label={tr("Закрыть","Close")}><Icon name="close"/></button></div>
    {children}
  </dialog>
}
