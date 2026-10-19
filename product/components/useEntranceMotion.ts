import {useLayoutEffect,useRef,type RefObject} from 'react'
import './entrance-motion.css'

// Animate task groups, never individual rows, fields, chart marks or navigation.
const wrappers='.pd-dashboard,.ep-directory,.ep-profile-settings,.ep-directory-groups'
const stable='.eh-event-stack,.ep-toast,.ep-undo-notice,[role="status"],[role="alert"],.wu-launchers,.ep-back,.pd-home-back,.ex-back,.ex-role-header,.ex-role-navigation,.admin-toolbar,.admin-tabs,.tw-tabs,.ex-tabs,[data-motion-stable],dialog,[popover],script,style'
export function startEntrance(root:HTMLElement):()=>void {
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
 if(preference.matches||typeof root.animate!=='function')return ()=>{}
 const animations:Animation[]=[]
 function collect(parent:Element,depth=0):HTMLElement[]{
  return Array.from(parent.children).flatMap(child=>{
   if(!(child instanceof HTMLElement)||child.matches(stable))return []
   return depth<2&&child.matches(wrappers)?collect(child,depth+1):[child]
  })
 }
 const visible=collect(root).filter(element=>{
  const box=element.getBoundingClientRect()
  return box.width>0&&box.height>0&&box.bottom>0&&box.top<window.innerHeight
 })
 for(const [index,element] of visible.slice(0,12).entries()){
  // Bounded choreography: even a large page is fully settled within 220 ms.
  const animation=element.animate([{opacity:.7},{opacity:1}],{
   duration:180,delay:Math.min(index*20,40),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'
  })
  animations.push(animation)
  void animation.finished.then(()=>animation.cancel(),()=>{})
 }
 const finish=()=>animations.forEach(animation=>animation.cancel())
 const reduce=()=>{if(preference.matches)finish()}
 const focus=(event:Event)=>{if(event.target instanceof HTMLElement&&event.target.matches('input,textarea,select,button,[contenteditable="true"]'))finish()}
 // A user can work immediately; motion must never slow down the next action.
 root.addEventListener('pointerdown',finish,{capture:true,once:true})
 root.addEventListener('keydown',finish,{capture:true,once:true})
 root.addEventListener('focusin',focus,{capture:true})
 root.addEventListener('wheel',finish,{capture:true,once:true,passive:true})
 preference.addEventListener('change',reduce)
 return ()=>{
  finish()
  root.removeEventListener('pointerdown',finish,true)
  root.removeEventListener('keydown',finish,true)
  root.removeEventListener('focusin',focus,true)
  root.removeEventListener('wheel',finish,true)
  preference.removeEventListener('change',reduce)
 }
}

/** A navigation identity, not changing form data, controls replay. No remounts. */
export function useEntranceMotion(ref:RefObject<HTMLElement|null>,view:string,initial=true){
 const previous=useRef(view)
 useLayoutEffect(()=>{
  const changed=previous.current!==view
  previous.current=view
  if(!initial&&!changed)return
  return ref.current?startEntrance(ref.current):undefined
 },[ref,view,initial])
}
