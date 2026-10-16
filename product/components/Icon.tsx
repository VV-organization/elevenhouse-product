import {useEffect,useRef,type CSSProperties} from 'react'
import {iconAssets} from './iconAssets'
import type {IconAnimation} from '../vendor/lottie'
import './icons.css'

/** A complete static symbol is always available; motion is loaded only on intent. */
export function Icon({name,size=22}:{name:string,size?:number}) {
 const root=useRef<HTMLSpanElement>(null),motion=useRef<HTMLSpanElement>(null)
 const asset=iconAssets[name]
 useEffect(()=>{
  const element=root.current,container=motion.current
  if(!asset?.animation||!element||!container)return
  const host=element.closest<HTMLElement>('button,a,summary,[role="button"]')
  // A row may contain a leading symbol and trailing arrow: animate only its main symbol.
  if(!host||host.querySelector('.ep-icon')!==element)return
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)')
  const pointer=window.matchMedia('(hover: hover) and (pointer: fine)')
  let instance:IconAnimation|undefined,disposed=false,active=false,played=false,loading=false
  const controller=new AbortController()
  function stop(){active=false;played=false;instance?.goToAndStop(0,true);element!.removeAttribute('data-playing')}
  async function play(){
   if(reduce.matches||host!.matches(':disabled,[aria-disabled="true"]')||played)return
   active=true;played=true
   if(loading)return
   try{
    if(!instance){
     loading=true
     const [{default:lottie},data]=await Promise.all([import('../vendor/lottie.js'),fetch(asset.animation!,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Icon unavailable');return r.json()})])
     if(disposed)return
     instance=lottie.loadAnimation({container:container!,renderer:'svg',loop:false,autoplay:false,animationData:data})
     instance.setSpeed(Math.max(1,instance.totalFrames/instance.frameRate/1.1))
     instance.addEventListener('complete',()=>{instance?.goToAndStop(0,true);element!.removeAttribute('data-playing')})
     loading=false
    }
    if(active&&!reduce.matches){element!.setAttribute('data-playing','true');instance.goToAndPlay(0,true)}
   }catch{loading=false;stop()}
  }
  const enter=(event:PointerEvent)=>{if(event.pointerType==='mouse'&&pointer.matches)void play()}
  const focus=()=>{if(host!.matches(':focus-visible')&&pointer.matches)void play()}
  const preference=()=>{if(reduce.matches)stop()}
  host.addEventListener('pointerenter',enter);host.addEventListener('pointerleave',stop)
  host.addEventListener('focusin',focus);host.addEventListener('focusout',stop)
  reduce.addEventListener('change',preference)
  return()=>{disposed=true;controller.abort();instance?.destroy();host.removeEventListener('pointerenter',enter);host.removeEventListener('pointerleave',stop);host.removeEventListener('focusin',focus);host.removeEventListener('focusout',stop);reduce.removeEventListener('change',preference)}
 },[asset])
 if(!asset)return null
 return <span ref={root} className="ep-icon" data-icon={name} aria-hidden="true" style={{width:size,height:size,'--icon-image':`url("${asset.static}")`} as CSSProperties}><span className="ep-icon-static"/><span className="ep-icon-motion" ref={motion}/></span>
}
