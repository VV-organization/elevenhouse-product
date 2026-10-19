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
  if(!asset||(!asset.animation&&!asset.motion)||!element||!container)return
  const host=element.closest<HTMLElement>('button,a,summary,[role="button"],label[data-icon-trigger]')
  // A row may contain a leading symbol and trailing arrow: animate only its main symbol.
  if(!host||host.querySelector('.ep-icon')!==element)return
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)')
  const pointer=window.matchMedia('(hover: hover) and (pointer: fine)')
  let instance:IconAnimation|undefined,disposed=false,active=false,played=false,loading=false
  const controller=new AbortController()
  let motionTimer:ReturnType<typeof setTimeout>|undefined
  function stop(){clearTimeout(motionTimer);active=false;played=false;instance?.goToAndStop(0,true);element!.removeAttribute('data-playing')}
  async function play(){
   if(reduce.matches||host!.matches(':disabled,[aria-disabled="true"]')||played)return
   active=true;played=true
   if(asset.motion){
    element!.setAttribute('data-playing','true')
    motionTimer=setTimeout(()=>element!.removeAttribute('data-playing'),1100)
    return
   }
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
  const focus=()=>{if((host!.matches(':focus-visible')||host!.querySelector(':focus-visible'))&&pointer.matches)void play()}
  const preference=()=>{if(reduce.matches)stop()}
  host.addEventListener('pointerenter',enter);host.addEventListener('pointerleave',stop)
  host.addEventListener('focusin',focus);host.addEventListener('focusout',stop)
  reduce.addEventListener('change',preference)
  return()=>{disposed=true;clearTimeout(motionTimer);controller.abort();instance?.destroy();host.removeEventListener('pointerenter',enter);host.removeEventListener('pointerleave',stop);host.removeEventListener('focusin',focus);host.removeEventListener('focusout',stop);reduce.removeEventListener('change',preference)}
 },[asset])
 if(!asset)return null
 return <span ref={root} className="ep-icon" data-icon={name} aria-hidden="true" style={{width:size,height:size,'--icon-image':`url("${asset.static}")`} as CSSProperties}><span className="ep-icon-static"/><span className="ep-icon-motion" ref={motion}>{asset.motion==='profile'?<ProfileMotion/>:asset.motion==='clock'?<ClockMotion/>:null}</span></span>
}

function ProfileMotion(){
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <rect x="2.5" y="3.5" width="19" height="17" rx="3"/><path d="M3 8h18M6 5.8h.1M8.5 5.8h.1"/>
  <g className="ep-icon-profile-person"><circle cx="8" cy="12" r="1.5"/><path d="M5.5 17c0-3 5-3 5 0"/></g>
  <path className="ep-icon-profile-line" pathLength="1" d="M14 12h4"/><path className="ep-icon-profile-line ep-icon-profile-line-last" pathLength="1" d="M14 16h4"/>
 </svg>
}
function ClockMotion(){
 return <svg viewBox="0 0 128 128" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"><circle cx="64" cy="64" r="46"/><path className="ep-icon-clock-hands" d="M64 35v29l22 13"/></svg>
}
