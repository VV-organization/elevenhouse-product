import {tr} from '../i18n'
import {Icon} from './Icon'
import {useEffect,useRef} from 'react'

export function mobileWorkspaceTab(page:string){
 if(page==='today'||page==='dashboard')return 'dashboard'
 if(page==='clients'||page.startsWith('client/'))return 'clients'
 if(page==='calendar'||page==='messages')return page
 return 'practice'
}

/** The original mobile app's five destinations, backed by the current router. */
export function MobileWorkspaceNavigation({page}:{page:string}){
 const active=mobileWorkspaceTab(page)
 const nav=useRef<HTMLElement>(null)
 useEffect(()=>{
  const root=nav.current?.closest<HTMLElement>('.mw-app'),viewport=window.visualViewport
  if(!root||!viewport)return
  const update=()=>{
   const typing=document.activeElement?.matches('input,textarea,[contenteditable="true"]')
   const keyboard=window.innerWidth<=800&&typing&&window.innerHeight-viewport.height>120
   root.toggleAttribute('data-mobile-keyboard',!!keyboard)
   root.style.setProperty('--mw-viewport-height',keyboard?`${viewport.height}px`:'100dvh')
  }
  viewport.addEventListener('resize',update)
  document.addEventListener('focusin',update)
  document.addEventListener('focusout',update)
  update()
  return ()=>{
   viewport.removeEventListener('resize',update)
   document.removeEventListener('focusin',update)
   document.removeEventListener('focusout',update)
   root.removeAttribute('data-mobile-keyboard')
   root.style.removeProperty('--mw-viewport-height')
  }
 },[])
 return <nav ref={nav} className="mw-tabbar" aria-label={tr('Мобильная навигация','Mobile navigation')}>
  {[
   ['dashboard','analytics',tr('Дашборд','Dashboard')],
   ['calendar','calendar',tr('Календарь','Calendar')],
   ['messages','message',tr('Сообщения','Messages')],
   ['clients','clients',tr('Клиенты','Clients')],
   ['practice','menu',tr('Ещё','More')],
  ].map(([id,icon,label])=><a key={id} href={`#${id}`} aria-current={active===id?'page':undefined}><Icon name={icon} size={22}/><span>{label}</span></a>)}
 </nav>
}
