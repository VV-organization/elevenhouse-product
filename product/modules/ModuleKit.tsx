import {localeTag, uiText} from '../i18n'
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react'
import { MEMBER_SCOPE, memberModuleValue } from '../state/memberAccount'
import type {Practice} from '../state/model'
import { Icon } from '../components/Icon'
export type ModuleProps={practice:Practice,onOpenClient:(id:string)=>void}
export const ModuleScopeContext=createContext<string|null>(null)
export function useModuleState<T>(key:string,example:boolean,initial:()=>T){const scope=useContext(ModuleScopeContext);const storageKey=`eh-product-v2-${scope??(example?'example':'mine')}-${key}`;const [value,setValue]=useState<T>(()=>{try{const raw=localStorage.getItem(storageKey);if(raw)return JSON.parse(raw)}catch{}return scope===MEMBER_SCOPE?memberModuleValue(key,initial):initial()});const [failed,setFailed]=useState(false);useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(value));setFailed(false)}catch{setFailed(true)}},[value,storageKey]);return [value,setValue,failed] as const}
export function SectionHeader({eyebrow,title,description,action}:{eyebrow?:string,title:string,description?:string,action?:ReactNode}){return <div className="ep-page-heading"><div>{eyebrow&&<p className="ep-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description&&<p className="ep-lead">{description}</p>}</div>{action}</div>}
export function EmptyState({icon='note',title,children,action}:{icon?:string,title:string,children:ReactNode,action?:ReactNode}){return <div className="ep-empty"><Icon name={icon} size={32}/><h2>{title}</h2><p>{children}</p>{action}</div>}
export function Notice({children,error=false}:{children:ReactNode,error?:boolean}){return <p className={`ex-notice${error?' ex-notice--error':''}`} role={error?'alert':'status'}>{typeof children==='string'?uiText(children):children}</p>}
export function money(n:number){return new Intl.NumberFormat(localeTag(),{maximumFractionDigits:0}).format(n)+' ₽'}

export function countLabel(n:number,forms:[string,string,string]){const category=new Intl.PluralRules(localeTag()).select(n);return `${n} ${forms[category==='one'?0:category==='few'?1:2]}`}
