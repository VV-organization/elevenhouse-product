import {tr} from '../i18n'
import {useState,useRef,useEffect} from 'react'

/** Keep entered data visible when a form is dismissed accidentally. */
export function useFormExit(onClose:()=>void){
 const warningRef=useRef<HTMLDivElement>(null)
 const [dirty,setDirty]=useState(false),[confirm,setConfirm]=useState(false)
 useEffect(()=>{if(confirm){warningRef.current?.scrollIntoView({block:'center'});warningRef.current?.querySelector('button')?.focus()}},[confirm])
 useEffect(()=>{
  if(!dirty)return
  const preventLoss=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''}
  window.addEventListener('beforeunload',preventLoss)
  return()=>window.removeEventListener('beforeunload',preventLoss)
 },[dirty])
 function changed(){setDirty(true);setConfirm(false)}
 function close(){if(dirty)setConfirm(true);else onClose()}
 const warning=confirm?<div ref={warningRef} className="ep-discard" role="alert"><p>{tr("Изменения ещё не сохранены.","Your changes have not been saved yet.")}</p><div className="ep-actions"><button type="button" className="ep-button" onClick={()=>setConfirm(false)}>{tr("Продолжить заполнение","Keep editing")}</button><button type="button" className="ep-text-button" onClick={onClose}>{tr("Выйти без сохранения","Leave without saving")}</button></div></div>:null
 return {changed,close,warning,dirty}
}
