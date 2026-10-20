import {populatedClientContent,populatedClientBilling} from './populated-client-data'
import {populateShowcaseAccount} from '../state/populatedAccount'
import {useInterfaceTheme} from '../state/interface-theme'
import {useEffect,useState} from 'react'
import {AuthPage} from '../auth/AuthPage'
import {PracticeStart,type StartIntent} from '../components/PracticeStart'
import {Workspace} from '../components/Workspace'
import {ModuleScopeContext,ModuleSeedContext,useModuleState} from '../modules/ModuleKit'
import {ClientPortal} from '../modules/ClientPortal'
import {Admin} from '../modules/Admin'
import {PublicProfilePreview} from '../modules/PublicProfile'
import {createMemberPractice} from '../state/memberAccount'
import {createEmptyPractice,parsePractice,type Practice} from '../state/model'
import {memberServices} from '../state/memberCore'
import {LanguageControl,tr,useLocale} from '../i18n'
import {clearLocalizedValidity,localizeInvalidControl} from '../validationCopy'
import {showcaseScope,showcaseKey,showcaseStorageKeys,showScreen,type ShowcaseView} from './showcase-model'
import {showcaseAdminData,showcasePublicProfile} from './showcase-data'
import type {PublicProfileState} from '../state/public-profile'
import type {Service} from '../modules/ServicesFinance'
import './showcase.css'
function read(key:string){try{return localStorage.getItem(key)}catch{return null}}
function reset(view:ShowcaseView){for(const key of showcaseStorageKeys(Object.keys(localStorage),view))localStorage.removeItem(key)}
function PresentationPage(){
 const [profile]=useModuleState<PublicProfileState>('public-profile',true,()=>({draft:showcasePublicProfile,prepared:null,preparedAt:null}))
 const [services]=useModuleState<Service[]>('services',true,()=>memberServices)
 return <main className="eh-demo-public"><div className="eh-demo-public-tools"><LanguageControl/><button className="ep-text-button" onClick={()=>showScreen('register-client')}>{tr('Войти в кабинет клиента','Client sign in')}</button></div><PublicProfilePreview profile={profile.draft} services={services} onBookService={id=>showScreen('client',id)}/></main>
}
export function DemoFrame({view}:{view:ShowcaseView}){
 const [generation,setGeneration]=useState(0),[resetError,setResetError]=useState(false)
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{if(event.origin!==window.location.origin||event.source!==window.parent||event.data?.type!=='elevenhouse:showcase-reset')return;try{reset(view);setResetError(false);window.history.replaceState(null,'',window.location.pathname+window.location.search+(view==='workspace'||view==='mobile'?'#dashboard':''));if(new URLSearchParams(window.location.search).has('service'))showScreen(view);else setGeneration(n=>n+1)}catch{setResetError(true)}}
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)
 },[view])
 return <>{resetError&&<p role="alert">{tr('Не удалось сбросить демоданные. Попробуйте ещё раз.','Could not reset demo data. Please try again.')}</p>}<DemoScreen key={generation} view={view}/></>
}
function DemoScreen({view}:{view:ShowcaseView}){
 useLocale()
 const fresh=view==='onboarding'||view==='register'
 const [practice,setPractice]=useState<Practice>(()=>{const saved=parsePractice(read(showcaseKey(view,'practice')))??(fresh?createEmptyPractice('Анна'):createMemberPractice());try{return populateShowcaseAccount(localStorage,view,saved)}catch{return saved}})
 const [theme,setTheme]=useInterfaceTheme(showcaseKey(view,'theme'))
 const [action,setAction]=useState(''),[failed,setFailed]=useState(false)
 const [stage,setStage]=useState<'start'|'workspace'>(()=>practice.onboarded?'workspace':'start')
 useEffect(()=>{try{localStorage.setItem(showcaseKey(view,'practice'),JSON.stringify(practice));setFailed(false)}catch{setFailed(true)}},[practice,view])
 useEffect(()=>{document.title=tr('Демонстрация — ElevenHouse','Presentation — ElevenHouse')},[])
 function begin(intent:StartIntent){setPractice(p=>({...p,onboarded:true}));setStage('workspace');window.location.hash=intent===null?'today':intent==='calculate'?'tools':'calendar';setAction(intent===null?'':intent==='calculate'?'calculate':'appointment')}
 function registrationDone(name:string,client:boolean,mode:'register'|'login'){
  if(mode==='login'){showScreen(client?'client':'workspace');return}
  const target=client?'client':'onboarding'
  try{reset(target);const next=client?createMemberPractice():createEmptyPractice(name||'Анна');if(client&&name)next.clients=next.clients.map(c=>c.id==='marina'?{...c,name}:c);localStorage.setItem(showcaseKey(target,'practice'),JSON.stringify(next))}catch{setFailed(true);return}
  showScreen(target)
 }
 return <ModuleScopeContext.Provider value={showcaseScope(view)}><ModuleSeedContext.Provider value={fresh?null:'member'}><div className="ep-root eh-demo-screen" data-theme={theme} onInvalidCapture={localizeInvalidControl} onInputCapture={clearLocalizedValidity} onChangeCapture={clearLocalizedValidity}>
 {failed&&<p role="alert" className="ep-storage-warning">{tr('Демоизменения не сохранены. Проверьте доступ к хранилищу браузера.','Demo changes were not saved. Check browser storage access.')}</p>}
 {view==='register'||view==='register-client'?<AuthPage initialMode="register" audience={view==='register-client'?'client':'practitioner'} onAuthenticated={identity=>registrationDone(identity.name,view==='register-client',identity.mode)}/>:view==='onboarding'&&stage==='start'?<PracticeStart name={practice.profile.name} onBegin={begin} onLogout={()=>showScreen('register')}/>:view==='client'?<><div className="ep-surface-language"><LanguageControl/></div><ClientPortal contentData={populatedClientContent} billingData={populatedClientBilling} practice={practice} clientId="marina" initialServiceId={new URLSearchParams(window.location.search).get('service')||undefined} onChangePractice={setPractice} onReturn={()=>showScreen('workspace')}/></>:view==='admin'?<><div className="ep-surface-language"><LanguageControl/></div><Admin data={showcaseAdminData} onReturn={()=>showScreen('workspace')}/></>:view==='page'?<PresentationPage/>:<Workspace data={{}} practice={practice} onChange={setPractice} theme={theme} onThemeChange={setTheme} onLogout={()=>showScreen('register')} onClientPreview={id=>showScreen('client',id)} initialAction={action} clearInitialAction={()=>setAction('')}/>}
 </div></ModuleSeedContext.Provider></ModuleScopeContext.Provider>
}
