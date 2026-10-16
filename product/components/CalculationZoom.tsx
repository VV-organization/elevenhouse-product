import {useLayoutEffect,useRef,useState,type ReactNode} from 'react'
import {tr} from '../i18n'

export function CalculationZoom({children}:{children:ReactNode}){
 const viewport=useRef<HTMLDivElement>(null),[width,setWidth]=useState(640)
 useLayoutEffect(()=>{const el=viewport.current;if(!el)return;const centre=()=>{if(el.clientWidth)el.scrollLeft=Math.max(0,(el.scrollWidth-el.clientWidth)/2)};centre();const resize=new ResizeObserver(centre);resize.observe(el);return()=>resize.disconnect()},[width])
 return <div className="ar-zoom-view"><div className="ar-zoom-toolbar" role="group" aria-label={tr('Масштаб карты','Chart zoom')}><button className="ep-button" onClick={()=>setWidth(Math.max(280,viewport.current?.clientWidth||320))}>{tr('Целиком','Fit')}</button><button className="ep-button" aria-label={tr('Уменьшить карту','Zoom out')} disabled={width<=280} onClick={()=>setWidth(n=>Math.max(280,n-160))}>−</button><output>{Math.round(width/640*100)}%</output><button className="ep-button" aria-label={tr('Увеличить масштаб карты','Zoom in')} disabled={width>=1280} onClick={()=>setWidth(n=>Math.min(1280,n+160))}>+</button></div><p className="ep-muted ar-zoom-hint">{tr('Прокрутите увеличенную карту, чтобы рассмотреть детали.','Scroll the enlarged chart to explore its details.')}</p><div ref={viewport} className="ar-zoom-canvas" tabIndex={0} aria-label={tr('Область карты с прокруткой','Scrollable chart area')}><div style={{width,minWidth:width,marginInline:'auto'}}>{children}</div></div></div>
}
