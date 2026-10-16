import {useState,useRef,useEffect} from 'react'

/** Keep entered data visible when a form is dismissed accidentally. */
export function useFormExit(onClose:()=>void){
 const warningRef=useRef<HTMLDivElement>(null)
 const [dirty,setDirty]=useState(false),[confirm,setConfirm]=useState(false)
 useEffect(()=>{if(confirm){warningRef.current?.scrollIntoView({block:'center'});warningRef.current?.querySelector('button')?.focus()}},[confirm])
 function changed(){setDirty(true);setConfirm(false)}
 function close(){if(dirty)setConfirm(true);else onClose()}
 const warning=confirm?<div ref={warningRef} className="ep-discard" role="alert"><p>Изменения ещё не сохранены.</p><div className="ep-actions"><button type="button" className="ep-button" onClick={()=>setConfirm(false)}>Продолжить заполнение</button><button type="button" className="ep-text-button" onClick={onClose}>Выйти без сохранения</button></div></div>:null
 return {changed,close,warning,dirty}
}
