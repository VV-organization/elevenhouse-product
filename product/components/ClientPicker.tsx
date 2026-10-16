import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { type Client, formatDate } from '../state/model'
import { Icon } from './Icon'
import { filterClients } from '../state/clientSearch'

type Props = { clients: Client[]; value: string; onChange: (id: string) => void; all?: boolean; label?: string; disabled?: boolean; name?: string; required?: boolean }
export function ClientPicker({clients,value,onChange,all=false,label='Клиент',disabled=false,name,required=false}:Props) {
 const [open,setOpen]=useState(false)
 const labelId=useId(),trigger=useRef<HTMLButtonElement>(null)
 const selected=clients.find(c=>c.id===value)
 const title=selected?.name||(all?'Все клиенты':'Выберите клиента')
 function close(){setOpen(false);requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}))}
 return <div className="ep-client-picker">
  <span id={labelId} className="ep-client-picker-label">{label}{required&&<span aria-hidden="true"> *</span>}</span>
  {name&&<input type="hidden" name={name} value={value}/>}
  <button ref={trigger} type="button" className="ep-client-picker-trigger" aria-labelledby={`${labelId} ${labelId}-value`} aria-haspopup="dialog" aria-expanded={open} disabled={disabled||(!clients.length&&!all)} onClick={()=>setOpen(true)}>
   <Icon name="clients" size={19}/><span id={`${labelId}-value`}>{title}</span><Icon name="down" size={18}/>
  </button>
  {open&&<ClientChooser clients={clients} value={value} all={all} onClose={close} onSelect={id=>{onChange(id);close()}}/>}
 </div>
}
function ClientChooser({clients,value,all,onSelect,onClose}:{clients:Client[];value:string;all:boolean;onSelect:(id:string)=>void;onClose:()=>void}) {
 const id=useId(),dialog=useRef<HTMLDialogElement>(null),search=useRef<HTMLInputElement>(null)
 const [query,setQuery]=useState(''),[active,setActive]=useState(()=>Math.max(0,filterClients(clients,'').findIndex(c=>c.id===value)+(all?1:0)))
 const visible=filterClients(clients,query)
 const options=[...(all&&!query.trim()?[{id:'',name:'Все клиенты',birthDate:'',birthPlace:''}]:[]),...visible]
 useEffect(()=>{const el=dialog.current!;el.showModal();search.current?.focus();return()=>el.close()},[])
 useEffect(()=>{const reveal=()=>dialog.current?.querySelector(`[data-option-index="${active}"]`)?.scrollIntoView({block:'nearest'});reveal();window.addEventListener('resize',reveal);return()=>window.removeEventListener('resize',reveal)},[active,query])
 function keyboard(event:KeyboardEvent<HTMLInputElement>){
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setActive(n=>Math.max(0,Math.min(options.length-1,n+(event.key==='ArrowDown'?1:-1))))}
  if(event.key==='Enter'){event.preventDefault();if(options[active])onSelect(options[active].id)}
 }
 return <dialog ref={dialog} className="ep-client-chooser" aria-labelledby={`${id}-title`} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}} onInput={e=>e.stopPropagation()} onChange={e=>e.stopPropagation()} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}>
  <header><h2 id={`${id}-title`}>Выберите клиента</h2><button type="button" className="ep-icon-button" aria-label="Закрыть выбор клиента" onClick={onClose}><Icon name="close"/></button></header>
  <div className="ep-client-chooser-search"><Icon name="search" size={20}/><input ref={search} type="text" role="combobox" aria-label="Поиск клиента" aria-autocomplete="list" aria-expanded="true" aria-controls={`${id}-list`} aria-activedescendant={options[active]?`${id}-option-${active}`:undefined} placeholder="Имя или фамилия" value={query} onChange={e=>{setQuery(e.target.value);setActive(0)}} onKeyDown={keyboard}/>{query&&<button type="button" className="ep-icon-button" aria-label="Очистить поиск клиентов" onClick={()=>{setQuery('');setActive(0);search.current?.focus()}}><Icon name="close" size={18}/></button>}</div>
  <div className="ep-client-chooser-list" role="listbox" id={`${id}-list`} aria-label="Клиенты">
   {options.map((client,index)=><button type="button" role="option" tabIndex={-1} aria-selected={value===client.id} id={`${id}-option-${index}`} key={client.id} data-option-index={index} className={`ep-client-choice${active===index?' is-active':''}`} onClick={()=>onSelect(client.id)}>
    <span className="ep-client-choice-avatar" aria-hidden="true">{client.id?client.name.split(/\s+/).slice(0,2).map(s=>s[0]).join(''):<Icon name="clients" size={18}/>}</span>
    <span className="ep-client-choice-text"><strong>{client.name}</strong>{client.id&&<small>{[client.birthDate?formatDate(client.birthDate):'',client.birthPlace].filter(Boolean).join(' · ')||'Данные рождения не заполнены'}</small>}</span>
    {value===client.id&&<Icon name="check" size={20}/>}
   </button>)}
  </div>
  {!options.length&&<div className="ep-client-chooser-empty"><strong>Клиент не найден</strong><p>Попробуйте другую часть имени или фамилии.</p><button type="button" className="ep-text-button" onClick={()=>{setQuery('');setActive(0);search.current?.focus()}}>Сбросить поиск</button></div>}
  <footer role="status">{query?`Найдено: ${visible.length} из ${clients.length}`:`Клиентов: ${clients.length}`}</footer>
 </dialog>
}
