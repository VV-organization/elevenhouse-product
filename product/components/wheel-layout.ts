import {norm} from '../state/natalChart'
import type {AstroLayer} from '../state/calculationPresentation'

/** Balanced label packing on the circle. Data longitudes are never altered.
 * Cut at the largest empty arc, then isotonic regression separates a cluster
 * around its original centre rather than pushing every label to one side. */
export function wheelLabels(layer:AstroLayer,minimumGap:number){
 const sorted=layer.positions.map(p=>({p,display:norm(p.longitude)})).sort((a,b)=>a.display-b.display)
 if(sorted.length<2)return sorted
 let start=0,largest=-1
 sorted.forEach((p,i)=>{const gap=norm(sorted[(i+1)%sorted.length].display-p.display);if(gap>largest){largest=gap;start=(i+1)%sorted.length}})
 const ordered=[...sorted.slice(start),...sorted.slice(0,start)]
 // Reserve the label gap at the wrap boundary as well.
 const gap=Math.min(minimumGap,360/ordered.length)
 const angles=ordered.map((entry,i)=>entry.display+(i&&entry.display<ordered[0].display?360:0))
 const blocks:{sum:number;count:number;start:number}[]=[]
 angles.forEach((angle,i)=>{
  blocks.push({sum:angle-i*gap,count:1,start:i})
  while(blocks.length>1){
   const b=blocks[blocks.length-1],a=blocks[blocks.length-2]
   if(a.sum/a.count<=b.sum/b.count)break
   blocks.splice(-2,2,{sum:a.sum+b.sum,count:a.count+b.count,start:a.start})
  }
 })
 const display:number[]=[]
 blocks.forEach(b=>{for(let i=b.start;i<b.start+b.count;i++)display[i]=b.sum/b.count+i*gap})
 // Dense, nearly uniform charts may exhaust the empty arc. A centred even
 // distribution is the bounded fallback; sparse charts retain their spacing.
 if(display[display.length-1]-display[0]>360-gap){
  const centre=angles.reduce((sum,a)=>sum+a,0)/angles.length
  return ordered.map((entry,i)=>({p:entry.p,display:norm(centre+(i-(ordered.length-1)/2)*gap)}))
 }
 return ordered.map((entry,i)=>({p:entry.p,display:norm(display[i])}))
}

type LabelPoint={id:string;x:number;y:number;text:string}
/** Place degree captions in the free space around each glyph, reserving the
 * house band, zodiac band, other glyphs and previously positioned captions. */
export function wheelDegreeLabels(points:LabelPoint[],innerRadius:number,fontSize:number){
 const boxes=points.map(p=>({x:p.x-20,y:p.y-20,w:40,h:40}))
 const overlaps=(a:{x:number;y:number;w:number;h:number},b:typeof a)=>a.x<b.x+b.w+2&&a.x+a.w+2>b.x&&a.y<b.y+b.h+2&&a.y+a.h+2>b.y
 const candidates=points.map(p=>{
  const w=p.text.length*fontSize*.65,h=fontSize+3,direction=p.y>320?-1:1
  const offsets=[{dx:0,dy:direction*28},...[-1,1].flatMap(sign=>[28,34,40,46].flatMap(dy=>[0,-10,10,-20,20,-30,30].map(dx=>({dx,dy:sign*dy})))),...[-1,1].flatMap(sign=>[0,-8,8,-16,16].map(dy=>({dx:sign*(24+w/2),dy})))]
  return {p,options:offsets.map(({dx,dy})=>{
   const x=p.x+dx,y=p.y+dy,b={x:x-w/2,y:y-h+2,w,h}
   const corners=[[b.x,b.y],[b.x+w,b.y],[b.x,b.y+h],[b.x+w,b.y+h]]
   const allowed=corners.every(([cx,cy])=>Math.hypot(cx-320,cy-320)<252&&Math.hypot(cx-320,cy-320)>innerRadius)
   return {x,y,b,allowed}
  }).filter(c=>c.allowed&&!boxes.some(b=>overlaps(c.b,b)))}
 }).sort((a,b)=>a.options.length-b.options.length)
 type Positions=Record<string,{x:number;y:number}|undefined>
 let steps=0,best:Positions={}
 const greedyBoxes:typeof boxes=[]
 for(const {p,options} of candidates){
  const c=options.find(option=>!greedyBoxes.some(b=>overlaps(option.b,b)))
  if(c){best[p.id]={x:c.x,y:c.y};greedyBoxes.push(c.b)}
 }
 if(Object.keys(best).length===points.length)return best
 // Most constrained caption first; a bounded search can move an earlier label
 // rather than losing a later one. The best partial fit is safe for extreme
 // payloads: exact degrees remain in the table and accessible planet name.
 const place=(remaining:typeof candidates,placed:typeof boxes,positions:Positions):Positions|undefined=>{
  if(Object.keys(positions).length>Object.keys(best).length)best={...positions}
  if(!remaining.length)return positions
  if(++steps>1200)return undefined
  const available=remaining.map(entry=>({...entry,options:entry.options.filter(c=>!placed.some(b=>overlaps(c.b,b)))})).sort((a,b)=>a.options.length-b.options.length)
  const next=available[0]
  for(const c of next.options){
   const found=place(available.slice(1),[...placed,c.b],{...positions,[next.p.id]:{x:c.x,y:c.y}})
   if(found)return found
   if(steps>1200)break
  }
  return undefined
 }
 return place(candidates,[],{})??best
}
