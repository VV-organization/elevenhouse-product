import {describe,it,expect,vi,afterEach} from 'vitest'
import {startEntrance} from './useEntranceMotion'
class ElementStub {
 children:ElementStub[]=[]
 kind='group'
 box={width:300,height:100,top:0,bottom:100}
 cancel=vi.fn()
 animate=vi.fn(()=>({cancel:this.cancel,finished:new Promise(()=>{})}))
 addEventListener=vi.fn()
 removeEventListener=vi.fn()
 matches(selector:string){return selector.split(',').includes(this.kind)}
 querySelector(){return null}
 contains(element:ElementStub){return this===element||this.children.includes(element)}
 getBoundingClientRect(){return this.box}
}
function setup(reduced=false){
 const media={matches:reduced,addEventListener:vi.fn(),removeEventListener:vi.fn()}
 vi.stubGlobal('window',{matchMedia:()=>media,innerHeight:800})
 vi.stubGlobal('HTMLElement',ElementStub)
 const root=new ElementStub()
 return {root,media,run:()=>startEntrance(root as unknown as HTMLElement)}
}
afterEach(()=>vi.unstubAllGlobals())
describe('task-group entrance motion',()=>{
 it('never hides content or starts timelines when reduced motion is enabled',()=>{
  const {root,run}=setup(true);const child=new ElementStub();root.children=[child];run()();expect(child.animate).not.toHaveBeenCalled()
 })
 it('keeps navigation stable, skips offscreen groups and does not animate every row',()=>{
  const {root,run}=setup();const nav=new ElementStub();nav.kind='.wu-launchers'
  const list=new ElementStub();list.children=[new ElementStub(),new ElementStub()]
  const offscreen=new ElementStub();offscreen.box={width:300,height:100,top:1000,bottom:1100}
  root.children=[nav,list,offscreen];run()
  expect(nav.animate).not.toHaveBeenCalled();expect(offscreen.animate).not.toHaveBeenCalled()
  expect(list.animate).toHaveBeenCalledTimes(1);expect(list.children[0].animate).not.toHaveBeenCalled()
 })
 it('keeps total entrance time bounded for long pages',()=>{
  const {root,run}=setup();root.children=Array.from({length:40},()=>new ElementStub());run()
  expect(root.children.filter(child=>child.animate.mock.calls.length)).toHaveLength(40)
  for(const child of root.children){const timing=child.animate.mock.calls[0] as unknown as [unknown,KeyframeAnimationOptions];expect(Number(timing[1].duration)+Number(timing[1].delay)).toBeLessThanOrEqual(364)}
 })
 it('cancels on interaction, a changed motion preference and unmount; removes listeners',()=>{
  const {root,media,run}=setup();const child=new ElementStub();root.children=[child];const clean=run()
  root.addEventListener.mock.calls.find(c=>c[0]==='pointerdown')![1]()
  expect(child.cancel).toHaveBeenCalledTimes(1)
  media.matches=true;media.addEventListener.mock.calls[0][1]()
  expect(child.cancel).toHaveBeenCalledTimes(1)
  clean();expect(child.cancel).toHaveBeenCalledTimes(1)
  expect(root.removeEventListener).toHaveBeenCalledTimes(4);expect(media.removeEventListener).toHaveBeenCalledOnce()
 })
 it('unpacks directory groups without animating parent and child simultaneously',()=>{
  const {root,run}=setup();const directory=new ElementStub();directory.kind='.ep-directory';const groups=new ElementStub();groups.kind='.ep-directory-groups';groups.children=[new ElementStub(),new ElementStub()];directory.children=[groups];root.children=[directory];run()
  expect(directory.animate).not.toHaveBeenCalled();expect(groups.animate).not.toHaveBeenCalled();expect(groups.children[0].animate).toHaveBeenCalledOnce()
 })
 it('keeps content readable and never animates notifications twice',()=>{
  const {root,run}=setup();const block=new ElementStub(),toast=new ElementStub();toast.kind='.eh-event-stack';root.children=[block,toast];run()
  const [frames]=block.animate.mock.calls[0] as unknown as [Keyframe[]]
  expect(Number(frames[0].opacity)).toBeGreaterThan(0)
  expect(frames.every(frame=>frame.transform===undefined)).toBe(true)
  expect(frames[0].translate).toBe('0 4px')
  expect(toast.animate).not.toHaveBeenCalled()
  expect(root.addEventListener.mock.calls.map(c=>c[0])).toEqual(expect.arrayContaining(['focusin','wheel']))
 })

 it('keeps navigation focus visible but finishes when an input receives focus',()=>{
  const {root,run}=setup();const child=new ElementStub();root.children=[child];run()
  const focus=root.addEventListener.mock.calls.find(c=>c[0]==='focusin')![1]
  focus({target:root});expect(child.cancel).not.toHaveBeenCalled()
  const input=new ElementStub();input.kind='input';focus({target:input});expect(child.cancel).toHaveBeenCalledOnce()
 })

 it('reveals a lower group once, disconnects on cleanup and ignores late callbacks',()=>{
  const {root,run}=setup()
  let reveal:(entries:unknown[])=>void=()=>{}
  const observer={observe:vi.fn(),unobserve:vi.fn(),disconnect:vi.fn()}
  vi.stubGlobal('IntersectionObserver',class {constructor(callback:typeof reveal){reveal=callback;return observer}})
  const lower=new ElementStub();lower.box.top=1000;root.children=[lower]
  const cleanup=run()
  expect(observer.observe.mock.calls[0]?.[0]===lower).toBe(true);expect(lower.animate).not.toHaveBeenCalled()
  reveal([{target:lower,isIntersecting:true}]);reveal([{target:lower,isIntersecting:true}])
  expect(lower.animate).toHaveBeenCalledOnce();expect(observer.unobserve.mock.calls[0]?.[0]===lower).toBe(true)
  cleanup();expect(observer.disconnect).toHaveBeenCalledOnce()
  reveal([{target:lower,isIntersecting:true}]);expect(lower.animate).toHaveBeenCalledOnce()
 })

 it('does not move a large working surface',()=>{
  const {root,run}=setup();const large=new ElementStub();large.box.height=900;root.children=[large];run()
  const [frames]=large.animate.mock.calls[0] as unknown as [Keyframe[]]
  expect(frames.every(frame=>frame.translate===undefined)).toBe(true)
 })

 it('stops pending scroll entrances when reduced motion is enabled mid-page',()=>{
  const {root,run,media}=setup()
  let reveal:(entries:unknown[])=>void=()=>{}
  const observer={observe:vi.fn(),unobserve:vi.fn(),disconnect:vi.fn()}
  vi.stubGlobal('IntersectionObserver',class {constructor(callback:typeof reveal){reveal=callback;return observer}})
  const lower=new ElementStub();lower.box.top=1000;root.children=[lower];run()
  media.matches=true;media.addEventListener.mock.calls[0][1]()
  reveal([{target:lower,isIntersecting:true}])
  expect(lower.animate).not.toHaveBeenCalled();expect(observer.disconnect).toHaveBeenCalledOnce()
 })

})
