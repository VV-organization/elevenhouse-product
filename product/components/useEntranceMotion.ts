import {useLayoutEffect,useRef,type RefObject} from 'react'
import './entrance-motion.css'

// Animate task groups, never individual rows, fields, chart marks or navigation.
const wrappers='.pd-dashboard,.pd-summary-grid,.pd-details-grid,.ep-directory,.ep-profile-settings,.ep-directory-groups,.td-home,.td-columns,.td-context,.td-agenda,.tw-workbench,.commerce-workspace,.ao-dashboard,.pc-main'
const stable='.eh-event-stack,.ep-toast,.ep-undo-notice,[role="status"],[role="alert"],.wu-launchers,.ep-back,.pd-home-back,.ex-back,.ex-role-header,.ex-role-navigation,.admin-toolbar,.admin-tabs,.tw-tabs,.ex-tabs,nav,[data-motion-stable],dialog,[popover],script,style'
export function startEntrance(root:HTMLElement):()=>void {
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
 if(preference.matches||typeof root.animate!=='function')return ()=>{}
 const animations=new Set<Animation>()
 const pending=new Set<HTMLElement>()
 let disposed=false
 function collect(parent:Element,depth=0):HTMLElement[]{
  return Array.from(parent.children).flatMap(child=>{
   if(!(child instanceof HTMLElement)||child.matches(stable))return []
   return depth<5&&child.matches(wrappers)?collect(child,depth+1):[child]
  })
 }
 function enter(element:HTMLElement,index=0){
  if(disposed||preference.matches)return
  const box=element.getBoundingClientRect()
  // Large working surfaces fade in place. Small groups settle by just 4 px.
  // Keep containers with dialogs/sticky tools stationary during their entrance.
  const move=box.height<window.innerHeight*.7&&!element.querySelector('dialog,[popover],[data-motion-stable]')
  const animation=element.animate([
   {opacity:.35,...(move?{translate:'0 4px'}:{})},
   {opacity:1,...(move?{translate:'0 0'}:{})}
  ],{
   duration:280,delay:Math.min(index*28,84),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'
  })
  animations.add(animation)
  void animation.finished.then(()=>{animation.cancel();animations.delete(animation)},()=>{animations.delete(animation)})
 }
 const observer:IntersectionObserver|undefined=typeof IntersectionObserver==='undefined'?undefined:new IntersectionObserver(entries=>{
  let index=0
  for(const entry of entries){
   const element=entry.target as HTMLElement
   if(!entry.isIntersecting||!pending.delete(element))continue
   observer?.unobserve(element)
   enter(element,index++)
  }
 },{threshold:0})
 let index=0
 for(const element of collect(root)){
  const box=element.getBoundingClientRect()
  if(box.width<=0||box.height<=0||box.bottom<=0)continue
  if(box.top<window.innerHeight)enter(element,index++)
  else if(observer){pending.add(element);observer.observe(element)}
 }
 const finish=()=>{animations.forEach(animation=>animation.cancel());animations.clear()}
 const stop=()=>{disposed=true;finish();observer?.disconnect();pending.clear()}
 const reduce=()=>{if(preference.matches)stop()}
 const focus=(event:Event)=>{
  if(!(event.target instanceof HTMLElement)||!event.target.matches('input,textarea,select,button,[contenteditable="true"]'))return
  finish()
  // Tabbing to an offscreen field must not trigger a later reveal around focus.
  for(const element of pending)if(element.contains(event.target)){pending.delete(element);observer?.unobserve(element)}
 }
 // A user can work immediately; motion must never slow down the next action.
 root.addEventListener('pointerdown',finish,{capture:true,once:true})
 root.addEventListener('keydown',finish,{capture:true,once:true})
 root.addEventListener('focusin',focus,{capture:true})
 root.addEventListener('wheel',finish,{capture:true,once:true,passive:true})
 preference.addEventListener('change',reduce)
 return ()=>{
  stop()
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
