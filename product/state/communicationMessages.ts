import type {Channel} from './communication-workflows'
import {messageOrderKey} from './ordering'
export type ConversationMessage={id:string;from:'client'|'you';text:string;time:string;sentAt?:string;channel?:Channel}
export type ExternalMessageThread={id:string;name:string;channel:Channel;address:string;messages:ConversationMessage[]}
export type LinkedMessageThread={clientId:string;thread:ExternalMessageThread}
export type MessageDraftRequest={clientId:string;clientName:string;channel:Channel;messages:ConversationMessage[];draft:string;language:'ru'|'en'}
export type MessageDraftAdapter=(request:MessageDraftRequest)=>Promise<{status:'ready';text:string}|{status:'error'|'unavailable';message?:string}>
export type MessageServerData={
 threads?:ExternalMessageThread[]
 requestDraft?:MessageDraftAdapter
 meetingUrls?:Record<string,string>
 createMeeting?:(request:{clientId:string;clientName:string})=>Promise<{status:'ready';url:string}|{status:'error'|'unavailable';message?:string}>
}
export function safeMeetingUrl(value:string|undefined){if(!value)return '';try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:''}catch{return ''}}
/** Preserve a copy of actual source messages; linking never creates or sends messages. */
export function linkMessageThread(records:Record<string,LinkedMessageThread>,thread:ExternalMessageThread,clientId:string){
 const previous=records[thread.id];if(previous?.clientId&&previous.clientId!==clientId)throw Error('already-linked')
 return {...records,[thread.id]:{clientId,thread:structuredClone(thread)}}
}
export function unlinkMessageThread(records:Record<string,LinkedMessageThread>,id:string){return records[id]?{...records,[id]:{...records[id],clientId:''}}:records}
export function availableMessageThreads(supplied:ExternalMessageThread[],records:Record<string,LinkedMessageThread>){return [...new Map([...Object.values(records).map(r=>r.thread),...supplied].map(t=>[t.id,t])).values()]}
export function conversationMessages(local:ConversationMessage[],threads:ExternalMessageThread[]){return [...local,...threads.flatMap(t=>t.messages.map(m=>({...m,id:`external:${t.id}:${m.id}`,channel:t.channel})))].sort((a,b)=>messageOrderKey(a).localeCompare(messageOrderKey(b)))}
