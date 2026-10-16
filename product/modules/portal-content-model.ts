import {validDate} from '../state/commerce-model'
export type PortalPost={id:string;title:string;summary:string;body?:string;kind:'forecast'|'broadcast'|'note'|'tip'|'announcement';publishedAt:string;status:'draft'|'published';audience:'public'|'subscribers';mediaUrl?:string;shareUrl?:string}
export type PortalMaterial={id:string;title:string;kind:'video'|'audio'|'document'|'chart'|'text';createdAt:string;description?:string;body?:string;url?:string;size?:string;orderId?:string}
export type PortalContentAccess={id:string;target:'post'|'material';contentId:string;status:'granted'|'revoked';expiresAt?:string}
/** Supplied by the application for the authenticated client. The server must enforce access before sending bodies or signed URLs. */
export type PortalContentData={clientId:string;specialistId:string;posts:PortalPost[];materials:PortalMaterial[];access:PortalContentAccess[];dayContexts?:{date:string;label:string}[]}
export function portalContent(data:PortalContentData|undefined,clientId:string|undefined,specialistId:string,now=new Date()){
 if(!clientId||data?.clientId!==clientId||data.specialistId!==specialistId)return {posts:[],materials:[],access:[]}
 return {posts:data.posts.filter(p=>p.status==='published'&&Number.isFinite(Date.parse(p.publishedAt))&&Date.parse(p.publishedAt)<=now.getTime()).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)),materials:[...data.materials].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),access:data.access}
}
export function contentReadable(target:'post'|'material',item:PortalPost|PortalMaterial,access:PortalContentAccess[],now=new Date()){
 if(target==='post'&&'audience' in item&&item.audience==='public')return true
 const matches=access.filter(a=>a.target===target&&a.contentId===item.id)
 return matches.length===1&&matches[0].status==='granted'&&(!matches[0].expiresAt||Date.parse(matches[0].expiresAt)>now.getTime())
}
export function safeContentUrl(value:string|undefined){try{const url=new URL(value??'');return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?url.href:undefined}catch{return undefined}}
export type DiaryMood='calm'|'energized'|'tired'|'anxious'|'inspired'|''
export type DiaryEntry={id:string;date:string;text:string;mood:DiaryMood;createdAt:string;sky?:string}
export function migrateDiary(entries:DiaryEntry[],legacy:string):DiaryEntry[]{return !legacy.trim()||entries.some(e=>e.id==='legacy-note')?entries:[...entries,{id:'legacy-note',date:'',text:legacy,mood:'',createdAt:''}]}
export function saveDiaryEntry(entries:DiaryEntry[],draft:Pick<DiaryEntry,'date'|'text'|'mood'|'sky'>,id:string,createdAt:string):DiaryEntry[]{
 if(!draft.text.trim())throw new Error('text')
 if(!validDate(draft.date))throw new Error('date')
 return [{...draft,id,text:draft.text.trim(),createdAt:entries.find(e=>e.id===id)?.createdAt||createdAt},...entries.filter(e=>e.id!==id)]
}
