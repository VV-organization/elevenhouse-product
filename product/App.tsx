import {resolvePortalContext} from './state/portal-context'
import type {ProductData} from './state/product-data'
import {localizeInvalidControl, clearLocalizedValidity} from './validationCopy'
import {tr, useLocale, LanguageControl} from './i18n'
import {givenName} from './state/names'
import { useEffect, useState } from 'react'
import { AuthPage, type AuthenticatedPreview } from './auth/AuthPage'
import { ModuleScopeContext } from './modules/ModuleKit'
import { accountForIdentity, accountPracticeKey, accountModuleScope, storedAccount, createMemberPractice, upgradeSeedClientNames, type AccountKind } from './state/memberAccount'
import { Icon } from './components/Icon'
import { Workspace } from './components/Workspace'
import { createEmptyPractice, createExamplePractice, parsePractice, type Practice } from './state/model'
import logo from './assets/brand/eleven-house-stacked.svg'
import {ClientPortal} from './modules/ClientPortal'
import {Admin} from './modules/Admin'

const keys={session:'eh-product-v1-session'}
function read(key:string){try{return localStorage.getItem(key)}catch{return null}}
const unreadable=new Set<string>(), protectedStorage=new Set<string>()
const memory:Partial<Record<AccountKind,Practice>>={}
function load(kind:AccountKind){if(memory[kind])return memory[kind]!;const key=accountPracticeKey(kind);const raw=read(key);const restored=parsePractice(raw);const parsed=restored&&(kind==='member'||kind==='example')?upgradeSeedClientNames(restored):restored;if(parsed)memory[kind]=parsed;else if(raw){unreadable.add(kind);try{localStorage.setItem(`${key}-recovery`,raw)}catch{protectedStorage.add(kind)}}return parsed}

export function App({data={}}:{data?:ProductData}={}){
  const {locale}=useLocale()
  const [account,setAccount]=useState<AccountKind>(()=>storedAccount(read(keys.session)))
  const [practice,setPractice]=useState<Practice>(()=>load(storedAccount(read(keys.session)))??createEmptyPractice(''))
  const [screen,setScreen]=useState<'auth'|'start'|'workspace'|'client'|'admin'>(()=>new URL(window.location.href).searchParams.has('mode')?'auth':new URL(window.location.href).searchParams.get('surface')==='client'?'client':new URL(window.location.href).searchParams.get('surface')==='admin'?'admin':read(keys.session)&&load(storedAccount(read(keys.session)))?(load(storedAccount(read(keys.session)))!.onboarded?'workspace':'start'):'auth')
  const [theme,setTheme]=useState<'dark'|'light'>(()=>read('eh-product-theme')==='light'?'light':'dark')
  function changeTheme(value:'dark'|'light'){setTheme(value);try{localStorage.setItem('eh-product-theme',value)}catch{}}
  function surface(value:'workspace'|'client'|'admin'){const u=new URL(window.location.href);if(value==='workspace'){u.searchParams.delete('surface');u.searchParams.delete('service')}else u.searchParams.set('surface',value);window.history.replaceState(null,'',u);setScreen(value)}
  const [previewServiceId,setPreviewServiceId]=useState<string|undefined>(()=>new URL(window.location.href).searchParams.get('service')||undefined)
  const [clientPreview,setClientPreview]=useState(()=>new URL(window.location.href).searchParams.has('service'))
  const [intent,setIntent]=useState<'calculate'|'calendar'>('calendar')
  const [initialAction,setInitialAction]=useState('')
  const [authKey,setAuthKey]=useState(0)
  const [storageWarning,setStorageWarning]=useState(false)

  useEffect(()=>{
    if(screen==='auth'||screen==='client'||screen==='admin')return
    memory[account]=practice
    try{if(protectedStorage.has(account))throw new Error('Protected recovery');localStorage.setItem(accountPracticeKey(account),JSON.stringify(practice));localStorage.setItem(keys.session,account);setStorageWarning(false)}catch{setStorageWarning(true)}
  },[practice,screen,account])

  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[screen])
  useEffect(()=>{if(screen!=='auth'&&screen!=='workspace')document.title=screen==='start'?tr("Первый шаг — ElevenHouse","Get started — ElevenHouse"):screen==='client'?tr("Кабинет клиента — ElevenHouse","Client account — ElevenHouse"):screen==='admin'?tr("Администрирование — ElevenHouse","Administration — ElevenHouse"):tr("Моя практика — ElevenHouse","My practice — ElevenHouse")},[screen,locale])

  function auth(mode:'login'|'register'){
    const url=new URL(window.location.href);url.searchParams.set('mode',mode);url.searchParams.delete('surface');url.hash='';window.history.replaceState(null,'',url)
    setAuthKey(k=>k+1);setScreen('auth');try{localStorage.removeItem(keys.session)}catch{}
  }
  function authenticated({name,channel,identifier}:AuthenticatedPreview){
    const kind=accountForIdentity(channel,identifier)
    const next=load(kind)??(kind==='member'?createMemberPractice():createEmptyPractice(name))
    setAccount(kind)
    surface('workspace');const url=new URL(window.location.href);url.searchParams.delete('mode');window.history.replaceState(null,'',url)
    setPractice(next);setScreen(next.onboarded?'workspace':'start');window.location.hash='today'
  }
  function changeClientPractice(next:Practice){
    const kind=clientPreview||account==='member'?account:'example'
    memory[kind]=next
    if(kind===account)setPractice(next)
    try{if(protectedStorage.has(kind))throw new Error('Protected recovery');localStorage.setItem(accountPracticeKey(kind),JSON.stringify(next));setStorageWarning(false)}catch{setStorageWarning(true)}
  }
  function begin(skip=false){
    setPractice(p=>({...p,onboarded:true}));setScreen('workspace');window.location.hash=skip?'today':intent==='calculate'?'tools':'calendar';setInitialAction(skip?'':intent==='calculate'?'calculate':'appointment')
  }
  const suppliedPortal=!!data.portal?.practice||!!data.portal?.clientId||!!data.portal?.moduleScope||!!data.portal?.activeAstrologerId&&data.portal.activeAstrologerId!=='current'
  const portalContext=suppliedPortal?resolvePortalContext(data.portal!,accountModuleScope(account)||account):null
  return <ModuleScopeContext.Provider key={account} value={accountModuleScope(account)}><div className="ep-root" data-theme={theme} lang={locale} onInvalidCapture={localizeInvalidControl} onInputCapture={clearLocalizedValidity} onChangeCapture={clearLocalizedValidity}>
    {(screen==='client'||screen==='admin')&&<div className="ep-surface-language"><LanguageControl/></div>}
    {screen==='client'?(suppliedPortal&&!portalContext?<main className="ex-role-layout"><p role="status">{tr('Данные выбранного специалиста ещё не загружены.','The selected specialist’s data has not loaded yet.')}</p><button className="ep-button" onClick={()=>surface('workspace')}>{tr('К практике','Back to workspace')}</button></main>:<ModuleScopeContext.Provider key={portalContext?.scope||account} value={portalContext?.scope??accountModuleScope(account)}><ClientPortal {...data.portal} practice={portalContext?.practice??(clientPreview||account==='member'?practice:load('example')??createExamplePractice())} initialServiceId={previewServiceId} onChangePractice={suppliedPortal?data.portal?.onChangePractice:changeClientPractice} onReturn={()=>surface('workspace')}/></ModuleScopeContext.Provider>):screen==='admin'?<Admin data={data.admin} onReturn={()=>surface('workspace')}/>:screen==='auth'?<AuthPage key={authKey} onAuthenticated={authenticated}/>:screen==='start'?<main className="ep-start">
      <header><img src={logo} alt="ElevenHouse" width="104"/><LanguageControl/><button className="ep-text-button" onClick={()=>auth('login')}>{tr("Выйти","Sign out")}</button></header>
      <div className="ep-start-content"><h1>{tr("С чего начнём","Where shall we start")}{practice.profile.name!=='Моя практика'?`, ${givenName(practice.profile.name)}`:''}?</h1><p className="ep-lead">{tr("Выберите первую задачу. Остальное можно настроить, когда понадобится.","Choose your first task. You can set up everything else when you need it.")}</p>
        <fieldset className="ep-start-options"><legend className="ep-sr-only">{tr("Первая задача","First task")}</legend>{[
          ['calendar','calendar',tr("Записать клиента на консультацию","Book a client consultation"),tr("Добавим клиента и выберем время. Услуги можно настроить позже.","Add a client and choose a time. You can set up services later.")],
          ['calculate','chart',tr("Подготовить расчёт","Prepare a calculation"),tr("Введите данные рождения или выберите клиента. Остальное можно заполнить позже.","Enter birth details or choose a client. You can add the rest later.")],
        ].map(([value,icon,title,description])=><label key={value} className={intent===value?'is-selected':''}><input type="radio" name="intent" value={value} checked={intent===value} onChange={()=>setIntent(value as typeof intent)}/><span className="ep-choice-icon"><Icon name={icon}/></span><span><strong>{title}</strong><small>{description}</small></span><span className="ep-radio" aria-hidden="true"/></label>)}</fieldset>
        <div className="ep-start-actions"><button className="ep-button ep-button--primary" onClick={()=>begin()}>{intent==='calendar'?tr("Записать первого клиента","Book your first client"):tr("Перейти к данным рождения","Enter birth details")} <Icon name="arrow"/></button><button className="ep-text-button" onClick={()=>begin(true)}>{tr("Начну самостоятельно","Explore on my own")}</button></div>
      </div>
    </main>:<Workspace data={data} key={account} theme={theme} onThemeChange={changeTheme} onClientPreview={(serviceId)=>{setPreviewServiceId(serviceId);setClientPreview(true);const u=new URL(window.location.href);if(serviceId)u.searchParams.set('service',serviceId);else u.searchParams.delete('service');window.history.replaceState(null,'',u);surface('client')}} practice={practice} onChange={setPractice} onLogout={()=>auth('login')} initialAction={initialAction} clearInitialAction={()=>setInitialAction('')}/>}
    {unreadable.size>0&&<div className="ep-recovery-notice" role="alert">{tr("Не удалось восстановить прошлую практику. Исходные данные сохранены для восстановления.","We couldn't restore your previous practice. The original data has been kept for recovery.")}</div>}
    {storageWarning&&<div className="ep-storage-warning" role="alert">{tr("Не удалось сохранить изменения. Не закрывайте страницу и попробуйте ещё раз.","Changes couldn't be saved. Keep this page open and try again.")}</div>}

  </div></ModuleScopeContext.Provider>
}
