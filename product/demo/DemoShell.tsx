import {useEffect,useRef,useState,type KeyboardEvent} from 'react'
import {tr,useLocale} from '../i18n'
import {SHOWCASE_VIEWS,showcaseView,isShowcaseView,frameUrl,type ShowcaseView} from './showcase-model'
import './showcase.css'
function route(){const query=new URLSearchParams(window.location.search);const view=showcaseView(query.get('view'));return {view,service:view==='client'?query.get('service')||undefined:undefined}}
export function DemoShell(){
 useLocale()
 const [current,setCurrent]=useState(route),[ready,setReady]=useState(false)
 const frame=useRef<HTMLIFrameElement>(null),navigation=useRef<HTMLElement>(null)
 const {view,service}=current
 function choose(next:ShowcaseView,nextService?:string,push=true){
  const cleanService=next==='client'?nextService:undefined
  const url=new URL(window.location.href);url.search='';url.searchParams.set('demo','1');url.searchParams.set('view',next);if(cleanService)url.searchParams.set('service',cleanService);url.hash=''
  window.history[push?'pushState':'replaceState'](null,'',url)
  if(next!==view||cleanService!==service){setReady(false);setCurrent({view:next,service:cleanService})}
 }
 useEffect(()=>{choose(view,service,false)},[])
 useEffect(()=>{
  const back=()=>{const next=route();if(next.view!==view||next.service!==service){setCurrent(next);setReady(false)}}
  const receive=(event:MessageEvent)=>{if(event.origin!==window.location.origin||event.source!==frame.current?.contentWindow||event.data?.type!=='elevenhouse:showcase-navigate'||!isShowcaseView(event.data.view))return;choose(event.data.view,typeof event.data.service==='string'?event.data.service:undefined)}
  window.addEventListener('popstate',back);window.addEventListener('message',receive)
  return()=>{window.removeEventListener('popstate',back);window.removeEventListener('message',receive)}
 },[view,service])
 useEffect(()=>{
  const button=navigation.current?.querySelector<HTMLButtonElement>(`button[data-view="${view}"]`);button?.scrollIntoView({block:'nearest',inline:'nearest'})
  document.title=tr('Показ ElevenHouse','ElevenHouse presentation')+' · '+SHOWCASE_VIEWS.find(v=>v.id===view)!.label
 },[view])
 function keyboard(event:KeyboardEvent<HTMLElement>){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
  const buttons=Array.from(navigation.current?.querySelectorAll<HTMLButtonElement>('button')??[]),index=buttons.indexOf(document.activeElement as HTMLButtonElement)
  if(index<0)return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();choose(SHOWCASE_VIEWS[next].id)
 }
 const active=SHOWCASE_VIEWS.find(v=>v.id===view)!
 return <div className="eh-showcase-shell">
  <main className={`eh-showcase-stage${view==='mobile'?' is-mobile':''}`} aria-label={tr('Демонстрационный экран','Presentation screen')}>
   {!ready&&<p className="eh-showcase-loading" role="status">{tr('Открываем экран…','Opening screen…')}</p>}
   <iframe ref={frame} key={`${view}:${service??''}`} src={frameUrl(window.location.href,view,service)} title={tr(active.label,active.en)} onLoad={()=>setReady(true)}/>
  </main>
  <footer className="eh-showcase-dock">
   <div className="eh-showcase-controls"><span>{tr('Демонстрация','Presentation')}<span className="eh-showcase-data-label"> · {tr('тестовые данные','sample data')}</span></span><div>{(view==='register'||view==='register-client')&&<span className="eh-showcase-code">{tr('Код','Code')}: <strong>123456</strong></span>}<button type="button" disabled={!ready} onClick={()=>frame.current?.contentWindow?.postMessage({type:'elevenhouse:showcase-reset'},window.location.origin)}>{tr('Начать заново','Restart screen')}</button><a href={window.location.pathname} aria-label={tr('Закрыть показ','Close presentation')} title={tr('Закрыть показ','Close presentation')}>×</a></div></div>
   <nav ref={navigation} className="eh-showcase-nav" aria-label={tr('Экраны демонстрации','Presentation screens')} onKeyDown={keyboard}>{SHOWCASE_VIEWS.map(item=><button type="button" key={item.id} data-view={item.id} aria-pressed={view===item.id} onClick={()=>{if(item.id!==view)choose(item.id)}}>{tr(item.label,item.en)}</button>)}</nav>
  </footer>
 </div>
}
