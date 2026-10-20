import {useState,type ReactNode} from 'react'
import {Dialog} from './Dialog'
import './action-hierarchy.css'

export function ContextHelp({title,children,printable=false}:{title:string;children:ReactNode;printable?:boolean}){
 const [open,setOpen]=useState(false)
 return <><div className="ep-context-help">
  <button type="button" className="ep-text-button" onClick={()=>setOpen(true)}><span className="ep-context-help-icon" aria-hidden="true">i</span>{title}</button>
  {open&&<Dialog title={title} placement="drawer" onClose={()=>setOpen(false)}><div className="ep-dialog-body ep-context-help-body">{children}</div></Dialog>}
 </div>{printable&&<section className="ep-context-help-print"><h3>{title}</h3>{children}</section>}</>
}
