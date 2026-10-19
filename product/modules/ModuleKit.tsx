import {localeTag, uiText} from '../i18n'
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react'
import { MEMBER_SCOPE, memberModuleValue } from '../state/memberAccount'
import type {Practice} from '../state/model'
import { Icon } from '../components/Icon'
export type ModuleProps={practice:Practice,onOpenClient:(id:string)=>void}
export const ModuleScopeContext=createContext<string|null>(null)
/** Optional fixture seed for an isolated presentation scope. Never changes its storage key. */
export const ModuleSeedContext=createContext<'member'|null>(null)
export function useModuleState<T>(key:string,example:boolean,initial:()=>T,synchronize=false){
 const scope=useContext(ModuleScopeContext),seed=useContext(ModuleSeedContext)
 const storageKey=`eh-product-v2-${scope??(example?'example':'mine')}-${key}`
 const [value,setValue]=useState<T>(()=>{try{const raw=localStorage.getItem(storageKey);if(raw)return JSON.parse(raw)}catch{}return scope===MEMBER_SCOPE||seed==='member'?memberModuleValue(key,initial):initial()})
 const [failed,setFailed]=useState(false)
 useEffect(()=>{
  if(!synchronize)return
  const refresh=()=>{try{const raw=localStorage.getItem(storageKey);if(raw!==null){const next=JSON.parse(raw) as T;setValue(old=>JSON.stringify(old)===raw?old:next)}}catch{}}
  const local=(event:Event)=>{if((event as CustomEvent<{key:string}>).detail?.key===storageKey)refresh()}
  const remote=(event:StorageEvent)=>{if(event.key===storageKey)refresh()}
  window.addEventListener('eh-module-saved',local);window.addEventListener('storage',remote)
  return()=>{window.removeEventListener('eh-module-saved',local);window.removeEventListener('storage',remote)}
 },[storageKey,synchronize])
 useEffect(()=>{try{const raw=JSON.stringify(value);if(localStorage.getItem(storageKey)!==raw){localStorage.setItem(storageKey,raw);window.dispatchEvent(new CustomEvent('eh-module-saved',{detail:{key:storageKey}}))}setFailed(false)}catch{setFailed(true)}},[value,storageKey])
 return [value,setValue,failed] as const
}
/** A live reader: never writes an old snapshot over another module's edits. */
export function useModuleSnapshot<T>(key:string,example:boolean,initial:()=>T){
 const scope=useContext(ModuleScopeContext),seed=useContext(ModuleSeedContext)
 const storageKey=`eh-product-v2-${scope??(example?'example':'mine')}-${key}`
 const read=()=>{try{const raw=localStorage.getItem(storageKey);if(raw)return JSON.parse(raw) as T}catch{}return scope===MEMBER_SCOPE||seed==='member'?memberModuleValue(key,initial):initial()}
 const [value,setValue]=useState<T>(read)
 useEffect(()=>{
  const refresh=()=>setValue(old=>{const next=read();return JSON.stringify(old)===JSON.stringify(next)?old:next})
  const local=(event:Event)=>{if((event as CustomEvent<{key:string}>).detail?.key===storageKey)refresh()}
  const remote=(event:StorageEvent)=>{if(event.key===storageKey||event.key===null)refresh()}
  refresh();window.addEventListener('eh-module-saved',local);window.addEventListener('storage',remote)
  return()=>{window.removeEventListener('eh-module-saved',local);window.removeEventListener('storage',remote)}
 },[storageKey,seed])
 return value
}
export function SectionHeader({eyebrow,title,description,action}:{eyebrow?:string,title:string,description?:string,action?:ReactNode}){return <div className="ep-page-heading"><div>{eyebrow&&<p className="ep-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p className="ep-lead">{description}</p>}</div>{action}</div>}
export function EmptyState({icon='note',title,children,action}:{icon?:string,title:string,children:ReactNode,action?:ReactNode}){return <div className="ep-empty"><Icon name={icon} size={32}/><h2>{title}</h2><p>{children}</p>{action}</div>}
export function Notice({children,error=false}:{children:ReactNode,error?:boolean}){return <p className={`ex-notice${error?' ex-notice--error':''}`} role={error?'alert':'status'}>{typeof children==='string'?uiText(children):children}</p>}
export function money(n:number){return new Intl.NumberFormat(localeTag(),{maximumFractionDigits:0}).format(n)+' ₽'}

export function countLabel(n:number,forms:[string,string,string]){const category=new Intl.PluralRules(localeTag()).select(n);return `${n} ${forms[category==='one'?0:category==='few'?1:2]}`}
