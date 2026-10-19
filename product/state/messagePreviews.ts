import type {Client} from './model'
import {availableMessageThreads,conversationMessages,type ConversationMessage,type ExternalMessageThread,type LinkedMessageThread} from './communicationMessages'
import {messageOrderKey} from './ordering'

export function messagePreviews(clients:Client[],threads:Record<string,ConversationMessage[]>,drafts:Record<string,string>,linked:Record<string,LinkedMessageThread>,supplied:ExternalMessageThread[]=[]){
 const external=availableMessageThreads(supplied,linked)
 return clients.flatMap(client=>{
  const last=conversationMessages(threads[client.id]||[],external.filter(t=>linked[t.id]?.clientId===client.id)).at(-1)
  const draft=drafts[client.id]?.trim()||''
  return last||draft?[{client,last,draft,waiting:last?.from==='client',order:last?messageOrderKey(last):''}]:[]
 }).sort((a,b)=>b.order.localeCompare(a.order))
}
