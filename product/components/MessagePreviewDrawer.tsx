import {useState} from 'react'
import {tr} from '../i18n'
import type {Practice} from '../state/model'
import type {LinkedMessageThread,MessageServerData} from '../state/communicationMessages'
import {messagePreviews} from '../state/messagePreviews'
import {useModuleState} from '../modules/ModuleKit'
import {initialConversations,messageTimestamp} from '../modules/Communication'
import {Dialog} from './Dialog'
import {Icon} from './Icon'
import './message-preview-drawer.css'

export function MessagePreviewDrawer({practice,data,onClose,onNavigate}:{practice:Practice;data?:MessageServerData;onClose:()=>void;onNavigate:(page:string,params?:Record<string,string>)=>void}){
 // Mount on opening so the preview reads the latest saved drafts and linked channels.
 const [messages]=useModuleState('conversations',practice.isExample,()=>initialConversations(practice))
 const [linked]=useModuleState<Record<string,LinkedMessageThread>>('communication-linked-threads',practice.isExample,()=>({}))
 const [limit,setLimit]=useState(20)
 const previews=messagePreviews(practice.clients,messages.threads,messages.drafts,linked,data?.threads)
 function open(clientId?:string){onClose();onNavigate('messages',clientId?{conversation:clientId}:undefined)}
 return <Dialog placement="drawer" className="wu-message-dialog" title={tr('Сообщения','Messages')} onClose={onClose}><div className="wu-message-preview">
  {previews.length?<div className="wu-message-list">{previews.slice(0,limit).map(({client,last,draft,waiting})=><button className="wu-message-item" key={client.id} onClick={()=>open(client.id)}>
   <span className="wu-preview-avatar" aria-hidden="true">{client.name.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('')}</span>
   <span className="wu-preview-content"><span className="wu-preview-top"><strong>{client.name}</strong>{last&&<time title={messageTimestamp(last)}>{messageTimestamp(last)}</time>}</span><span className="wu-preview-text">{draft?<><b>{tr('Черновик: ','Draft: ')}</b>{draft}</>:<>{last?.from==='you'&&<b>{tr('Вы: ','You: ')}</b>}{last?.text}</>}</span>{waiting&&<span className="wu-preview-waiting"><i aria-hidden="true"/>{tr('Ждёт ответа','Awaiting reply')}</span>}</span><Icon name="arrow" size={15}/>
  </button>)}{previews.length>limit&&<button className="ep-text-button wu-preview-more" onClick={()=>setLimit(n=>n+20)}>{tr('Показать ещё','Show more')}</button>}</div>:<div className="wu-preview-empty"><Icon name="message" size={32}/><h3>{tr('Здесь появятся ваши диалоги','Your conversations will appear here')}</h3><p>{tr('Откройте сообщения, чтобы выбрать клиента и начать переписку.','Open messages to choose a client and start a conversation.')}</p></div>}
  <footer className="wu-preview-footer"><button className="ep-button ep-button--primary" onClick={()=>open()}>{tr('Все сообщения','All messages')}<Icon name="arrow" size={18}/></button></footer>
 </div></Dialog>
}
