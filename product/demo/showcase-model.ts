export const SHOWCASE_VIEWS=[
 {id:'register',label:'Регистрация',en:'Registration'},
 {id:'register-client',label:'Рег. клиента',en:'Client signup'},
 {id:'onboarding',label:'Онбординг',en:'Onboarding'},
 {id:'workspace',label:'Кабинет',en:'Workspace'},
 {id:'mobile',label:'Моб. кабинет',en:'Mobile'},
 {id:'client',label:'Клиент',en:'Client'},
 {id:'page',label:'Страница',en:'Public page'},
 {id:'admin',label:'Админка',en:'Admin'},
] as const
export type ShowcaseView=typeof SHOWCASE_VIEWS[number]['id']
export function isShowcaseView(value:unknown):value is ShowcaseView{return typeof value==='string'&&SHOWCASE_VIEWS.some(v=>v.id===value)}
export function showcaseView(value:string|null):ShowcaseView{return isShowcaseView(value)?value:'workspace'}
export function showcaseScope(view:ShowcaseView){return `showcase:${view}:v1`}
export function showcaseKey(view:ShowcaseView,name:string){return `eh-showcase:${view}:${name}`}
export function showcaseStorageKeys(keys:string[],view:ShowcaseView){return keys.filter(k=>k.startsWith(`eh-product-v2-${showcaseScope(view)}-`)||k.startsWith(showcaseKey(view,'')))}
export function showcaseSection(view:ShowcaseView,section?:string|null){return view==='client'&&['orders','messages'].includes(section??'')||view==='register-client'&&section==='login'?section||undefined:undefined}
export function frameUrl(current:string,view:ShowcaseView,service?:string,section?:string){const url=new URL(current);url.search='';url.searchParams.set('demoFrame',view);if(view==='client'&&service)url.searchParams.set('service',service);if(showcaseSection(view,section))url.searchParams.set('section',section!);url.hash=view==='workspace'||view==='mobile'?'dashboard':'';return url.href}
export function showScreen(view:ShowcaseView,service?:string,section?:string){if(window.parent!==window){window.parent.postMessage({type:'elevenhouse:showcase-navigate',view,service,section},window.location.origin)}else{const url=new URL(window.location.href);url.search='';url.searchParams.set('demo','1');url.searchParams.set('view',view);if(service)url.searchParams.set('service',service);if(showcaseSection(view,section))url.searchParams.set('section',section!);url.hash='';window.location.assign(url.href)}}
