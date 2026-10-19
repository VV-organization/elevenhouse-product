import {useState} from 'react'
import {Dialog} from './Dialog'
import {Icon} from './Icon'
import {tr} from '../i18n'
import './section-navigation.css'
export type SectionGroup={label:string;items:{id:string;label:string;count?:number}[]}
export function SectionNavigation({label,groups,value,onChange,primary=[]}:{label:string;groups:SectionGroup[];value:string;onChange:(id:string)=>void;primary?:string[]}){
 const [open,setOpen]=useState(false)
 const items=groups.flatMap(g=>g.items),current=items.find(i=>i.id===value)
 const choose=(id:string)=>{setOpen(false);onChange(id)}
 const menu=()=>groups.map(group=><section key={group.label} className="ep-section-nav-group"><h2>{group.label}</h2>{group.items.map(item=><button key={item.id} type="button" aria-current={item.id===value?'page':undefined} onClick={()=>choose(item.id)}><span>{item.label}</span>{item.count!==undefined&&item.count>0&&<small>{item.count}</small>}</button>)}</section>)
 return <div className="ep-section-navigation"><nav className="ep-section-nav-desktop" aria-label={label}>{menu()}</nav><nav className="ep-section-nav-mobile" aria-label={label}>{primary.length>0&&<div className="ep-section-nav-primary">{items.filter(i=>primary.includes(i.id)).map(item=><button key={item.id} aria-current={item.id===value?'page':undefined} onClick={()=>choose(item.id)}>{item.label}</button>)}</div>}<button type="button" className="ep-section-nav-open" aria-expanded={open} onClick={()=>setOpen(true)}><span>{primary.includes(value)?label:current?.label||label}</span><span>{tr('Разделы','Sections')} <Icon name="menu" size={18}/></span></button></nav>{open&&<Dialog title={label} onClose={()=>setOpen(false)}><nav className="ep-dialog-body ep-section-nav-dialog" aria-label={label}>{menu()}</nav></Dialog>}</div>
}
