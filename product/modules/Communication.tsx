import type {ContentServerData,ReviewServerData} from '../state/communication-results'
import './communication-workspace.css'
import {ContentWorkspace} from './communication-content'
import {FlowWorkspace} from './communication-flows'
import {ReviewsWorkspace} from './communication-reviews'
import {Attachments,ChannelSelect,channelNames,Field} from './communication-controls'
import {addContact,availableContacts,type Contact,type Channel,type Attachment} from '../state/communication-workflows'
import {Select} from '../components/Select'
import {tr, localeTag} from '../i18n'
import {matchesClientQuery} from '../state/clientSearch'
import {initialMaterials} from './Tools'
import {useLearning} from '../components/Learning'
import {ClientPicker} from '../components/ClientPicker'
import {messageOrderKey} from '../state/ordering'
import {givenName} from '../state/names'
import { useState,useEffect,useRef } from 'react'
import { Dialog } from '../components/Dialog'
import { Icon } from '../components/Icon'
import { formatDate, type Client, type Appointment } from '../state/model'
import { EmptyState, Notice, SectionHeader, useModuleState, type ModuleProps } from './ModuleKit'

type Section = 'messages'|'content'|'automations'|'reviews'
type Message = { id:string; from:'client'|'you'; text:string; time:string; sentAt?:string;channel?:Channel }
type Conversations = {threads:Record<string,Message[]>; drafts:Record<string,string>}
type ScenarioKind = 'before'|'after'|'data'
export function prepareScenarioPreview(kind:ScenarioKind,text:string,client:Client,appointment?:Appointment){
 if(kind==='before'&&(!appointment||appointment.clientId!==client.id||appointment.status!=='confirmed'))throw new Error(tr("У клиента нет подтверждённой встречи. Выберите другого клиента или сохраните сценарий на паузе.", "This client has no confirmed appointment. Choose another client or save the reminder as paused."))
 if(kind==='after'&&(!appointment||appointment.clientId!==client.id||appointment.status!=='completed'))throw new Error(tr("У клиента нет завершённой встречи. Завершите её в календаре или выберите другого клиента.", "This client has no completed appointment. Mark one as completed in the calendar or choose another client."))
 if(kind==='data'&&client.birthDate&&client.birthPlace&&client.birthTime&&!client.unknownTime)throw new Error(tr("Все данные рождения уже заполнены. Уточнение не требуется. Выберите другого клиента.", "All birth details are already complete. Choose another client."))
 return fillScenarioText(text,client,appointment)
}
function fillScenarioText(text:string,client:Client,appointment?:Appointment) {
 const values:Record<string,string>={name:givenName(client.name),date:appointment?formatDate(appointment.date):tr('[дата встречи]','[appointment date]'),time:appointment?.time||tr('[время встречи]','[appointment time]')}
 const keys:Record<string,string>={'имя':'name','дата':'date','время':'time',name:'name',date:'date',time:'time'}
 return text.replace(/\{(имя|дата|время|name|date|time)\}/g,(_,key:string)=>values[keys[key]])
}
export function messageTimestamp(message:Pick<Message,'time'|'sentAt'>) {
 let key=messageOrderKey(message)
 const legacyTime=message.time.match(/(\d{1,2}):(\d{2})/)
 if(key&&!message.sentAt&&legacyTime)key=`${key.slice(0,10)}T${legacyTime[1].padStart(2,'0')}:${legacyTime[2]}`
 if (!key) return message.time.replace(/^Предпросмотр · /, '')
 // sentAt is a wall-clock timestamp in the practice time zone. UTC preserves that clock value.
 const date=new Date(key.endsWith('Z')||/[+-]\d{2}:\d{2}$/.test(key)?key:`${key}Z`)
 if(!Number.isFinite(date.getTime()))return message.time
 return new Intl.DateTimeFormat(localeTag(),{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(date)
}
function id(){return crypto.randomUUID()}
export function birthTimeReply(client:Pick<Client,'name'|'unknownTime'|'birthTime'>){return tr(`${givenName(client.name)}, можно начать без точного времени рождения. Я отмечу, что время неизвестно: положения домов и асцендент в таком случае нельзя считать надёжными. Вы знаете хотя бы примерный промежуток — утро, день или вечер? Если нет, ничего придумывать не нужно. Вместе выберем подходящий формат консультации.`, `${givenName(client.name)}, we can start without an exact birth time. I will mark it as unknown, so we will not rely on house positions or the ascendant. Do you know an approximate time — morning, afternoon or evening? If not, there is no need to guess. We can choose a suitable consultation together.`)}
function Back({onClick,text=tr("Назад к списку", "Back to list")}:{onClick:()=>void;text?:string}){return <button className="ep-text-button" onClick={onClick}><Icon name="back"/>{text}</button>}
function StorageWarning({failed}:{failed:boolean}){return failed?<Notice error>{tr("Не удалось сохранить изменения. Не закрывайте эту страницу.", "Could not save changes. Keep this page open.")}</Notice>:null}

export function Communication({section,practice,onOpenClient,data}:ModuleProps&{section:Section;data?:{content?:ContentServerData;reviews?:ReviewServerData}}){
 const props={practice,onOpenClient}
 return section==='messages'?<Messages key={`messages-${practice.isExample}`} {...props}/>:section==='content'?<ContentWorkspace key={`content-${practice.isExample}`} {...props} data={data?.content}/>:section==='automations'?<FlowWorkspace key={`automations-${practice.isExample}`} {...props}/>:<ReviewsWorkspace key={`reviews-${practice.isExample}`} {...props} data={data?.reviews}/>
}
export function initialConversations(practice:ModuleProps['practice']):Conversations{return {drafts:{},threads:practice.isExample?Object.fromEntries(practice.clients.map(c=>[c.id,[{id:`initial-${c.id}`,from:'client',text:c.unknownTime?'Я не знаю точное время рождения. Можно ли без него?':c.id==='marina'?'Здравствуйте! Хочу обсудить смену работы на нашей встрече.':'Спасибо за встречу! Вернусь с вопросами после того, как перечитаю заметки.',time:'15 октября · 09:30'}]])): {}}}
function Messages({practice,onOpenClient}:ModuleProps){
 const learning=useLearning()
 const [state,setState,failed]=useModuleState<Conversations>('conversations',practice.isExample,()=>initialConversations(practice))
 const [materials]=useModuleState('library',practice.isExample,()=>initialMaterials(practice.isExample))
 const [contacts,setContacts,contactsFailed]=useModuleState<Record<string,Contact[]>>('communication-contacts',practice.isExample,()=>({}))
 const [files,setFiles,filesFailed]=useModuleState<Record<string,Attachment[]>>('communication-attachments',practice.isExample,()=>({}))
 const [outbox,setOutbox,outboxFailed]=useModuleState<Array<{id:string;clientId:string;text:string;channel:Channel;address:string;files:Attachment[];created:string}>>('communication-outbox',practice.isExample,()=>[])
 const [channel,setChannel]=useState<Channel>('portal'),[channelFilter,setChannelFilter]=useState('all'),[manageContacts,setManageContacts]=useState(false),[contactChannel,setContactChannel]=useState<Channel>('email'),[address,setAddress]=useState(''),[contactError,setContactError]=useState('')

 const [materialPicker,setMaterialPicker]=useState(false),[materialSearch,setMaterialSearch]=useState('')
 const [selected,setSelected]=useModuleState<string>('messages-selected',practice.isExample,()=>''),[search,setSearch]=useModuleState<string>('messages-search',practice.isExample,()=>''),[filter,setFilter]=useModuleState<string>('messages-filter',practice.isExample,()=>'all'),[notice,setNotice]=useState('')
 useEffect(()=>{const url=new URL(window.location.href),requested=url.searchParams.get('conversation');if(url.searchParams.get('filter')==='reply'){setFilter('reply');setSelected('');setSearch('');url.searchParams.delete('filter');window.history.replaceState(null,'',url)}if(requested&&practice.clients.some(c=>c.id===requested)){setSelected(requested);setSearch('');setFilter('all');url.searchParams.delete('conversation');window.history.replaceState(null,'',url)}},[])
 const client=practice.clients.find(c=>c.id===selected)
 const linkedContacts=availableContacts(contacts[selected]||[],client)
 const threads=Object.fromEntries(Object.entries(state.threads).map(([key,items])=>[key,[...items].sort((a,b)=>messageOrderKey(a).localeCompare(messageOrderKey(b)))]))
 const messages=(threads[selected]||[]).filter(m=>channelFilter==='all'||(m.channel||'portal')===channelFilter)
 const threadRef=useRef<HTMLDivElement>(null)
 const [showLatest,setShowLatest]=useState(false)
 const lastMessageId=messages.at(-1)?.id
 function scrollToLatest(){const thread=threadRef.current;if(thread)thread.scrollTop=thread.scrollHeight;setShowLatest(false)}
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'})},[selected])
 useEffect(()=>{scrollToLatest()},[selected,lastMessageId])
 const needsReply=(clientId:string)=>threads[clientId]?.at(-1)?.from==='client'
 const visible=practice.clients.filter(c=>matchesClientQuery(c.name,search)&&(filter==='all'||needsReply(c.id))).sort((a,b)=>messageOrderKey(threads[b.id]?.at(-1)).localeCompare(messageOrderKey(threads[a.id]?.at(-1))))
 function draft(text:string){setState(s=>({...s,drafts:{...s.drafts,[selected]:text}}));setNotice('')}

 function sendMessage(){
  const text=state.drafts[selected]?.trim()||'',attachments=files[selected]||[];if(!text&&!attachments.length)return
  const contact=linkedContacts.find(c=>c.channel===channel)
  if(channel!=='portal'&&!contact){setContactError(tr('Сначала добавьте контакт клиента для этого канала.','Add a client contact for this channel first.'));setManageContacts(true);return}
  setOutbox(items=>[...items,{id:id(),clientId:selected,text,channel,address:contact?.address||'',files:attachments,created:new Date().toISOString()}]);setState(s=>({...s,drafts:{...s.drafts,[selected]:''}}));setFiles(f=>({...f,[selected]:[]}));learning.complete('messages');setNotice(tr('Сообщение подготовлено и ожидает отправки.','Message prepared and awaiting delivery.'))
 }
 function linkContact(){try{addContact(linkedContacts,{id:id(),channel:contactChannel,address});const next=addContact(contacts[selected]||[],{id:id(),channel:contactChannel,address});setContacts(c=>({...c,[selected]:next}));setAddress('');setContactError('')}catch(e){setContactError((e as Error).message==='duplicate'?tr('Этот контакт уже связан с клиентом.','This contact is already linked to the client.'):tr('Укажите адрес или имя в канале.','Enter an address or channel username.'))}}

 return <>
  {materialPicker&&client&&<Dialog title={tr("Добавить материал в ответ", "Add a material to your reply")} onClose={()=>setMaterialPicker(false)}><div className="ep-dialog-body"><label className="ep-search"><Icon name="search"/><input aria-label={tr("Найти материал", "Find a material")} placeholder={tr("Название материала", "Material title")} value={materialSearch} onChange={e=>setMaterialSearch(e.target.value)}/></label><p className="ep-muted">{tr("Текст добавится в черновик. Вы сможете проверить и изменить его перед отправкой.", "The text will be added to your draft. You can review and edit it before sending.")}</p><div className="ep-help-list">{materials.filter(m=>m.title.toLocaleLowerCase().includes(materialSearch.toLocaleLowerCase())).map(m=><button key={m.id} onClick={()=>{draft([state.drafts[selected]?.trim(),m.title,m.text].filter(Boolean).join('\n\n'));setMaterialPicker(false)}}>{m.title}<Icon name="plus" size={18}/></button>)}</div>{!materials.length&&<p>{tr("Материалов пока нет. ", "No materials yet. ")}<a href="#library">{tr("Добавить в «Мои материалы»", "Add to My materials")}</a></p>}{materials.length>0&&!materials.some(m=>m.title.toLocaleLowerCase().includes(materialSearch.toLocaleLowerCase()))&&<p>{tr("Ничего не найдено. Попробуйте другое название.", "Nothing found. Try another title.")}</p>}</div></Dialog>}
  {!client&&<><SectionHeader title={tr("Сообщения", "Messages")}/></>}
  <StorageWarning failed={failed||contactsFailed||filesFailed||outboxFailed}/>{notice&&<Notice>{notice}</Notice>}
  {client?<>
   <div className="ex-toolbar"><Back onClick={()=>{setSelected('');setNotice('')}}/><button className="ep-text-button" onClick={()=>onOpenClient(client.id)}>{tr("Карточка клиента ", "Client profile ")}<Icon name="arrow"/></button></div>
   <section className="ex-panel ex-conversation">
    <div className="ep-section-heading ex-conversation-header"><h1 className="ex-conversation-title">{client.name}</h1><span className="ex-status">{needsReply(client.id)?tr("Ждёт ответа", "Awaiting reply"):tr("Нет новых вопросов", "No new questions")}</span></div>
    <div className="communication-channel-bar"><ChannelSelect label={tr('Ответить через','Reply via')} value={channel} onChange={setChannel}/><button className="ep-button" onClick={()=>{setManageContacts(!manageContacts);setContactError('')}} aria-expanded={manageContacts}>{tr('Контакты и каналы','Contacts and channels')}</button><Field label={tr('Показать переписку','Show messages')}><Select value={channelFilter} onChange={e=>setChannelFilter(e.target.value)}><option value="all">{tr('Все каналы','All channels')}</option>{Object.entries(channelNames()).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select></Field></div>
    {manageContacts&&<section className="communication-contacts"><h2>{tr('Связанные контакты','Linked contacts')}</h2><p className="ep-muted">{tr('Связывайте только контакты этого человека. История сообщений сохраняется при удалении контакта.','Only link contacts belonging to this person. Removing a contact preserves message history.')}</p>{client.phone&&<div className="ex-row"><div><strong>{tr('Телефон','Phone')}</strong><p>{client.phone}</p></div><button className="ep-text-button" onClick={()=>onOpenClient(client.id)}>{tr('Изменить в карточке','Edit in client profile')}</button></div>}{linkedContacts.map(c=><div className="ex-row" key={c.id}><div><strong>{channelNames()[c.channel]}</strong><p>{c.address}</p></div>{c.source==='profile'?<button className="ep-text-button" onClick={()=>onOpenClient(client.id)}>{tr('Изменить в карточке','Edit in client profile')}</button>:<button className="ep-text-button" onClick={()=>setContacts(all=>({...all,[selected]:all[selected].filter(x=>x.id!==c.id)}))}>{tr('Отвязать','Unlink')}</button>}</div>)}<div className="ep-form-pair"><ChannelSelect value={contactChannel} onChange={setContactChannel}/><Field label={tr('Адрес / телефон / имя в канале','Address / phone / username')}><input value={address} onChange={e=>setAddress(e.target.value)}/></Field></div>{contactError&&<Notice error>{contactError}</Notice>}<button className="ep-button" disabled={!address.trim()} onClick={linkContact}>{tr('Связать контакт','Link contact')}</button></section>}
    <details className="ex-conversation-context"><summary>{tr("Запрос клиента", "Client request")}</summary><p className="ep-muted">{client.request||tr("Тема консультации пока не указана", "No consultation topic yet")}</p></details>
    <div ref={threadRef} className="ex-message-thread" role="region" tabIndex={0} aria-label={tr(`Переписка: ${client.name}. Прокрутите вверх, чтобы прочитать предыдущие сообщения.`, `Conversation with ${client.name}. Scroll up to read earlier messages.`)} onScroll={e=>{const el=e.currentTarget;setShowLatest(el.scrollHeight-el.clientHeight-el.scrollTop>80)}}>
     {messages.length?messages.map(m=><article className={`ex-message-bubble ${m.from==='you'?'is-outgoing':'is-incoming'}`} key={m.id}><p className="ex-message-meta">{m.from==='client'?client.name:tr("Вы", "You")} · {messageTimestamp(m)} · {channelNames()[m.channel||'portal']}</p><p className="ex-message-text">{m.text}</p></article>):<p className="ex-note">{tr("Переписки пока нет. Подготовьте первое сообщение.", "No messages yet. Write your first message.")}</p>}
    </div>
    {showLatest&&<button className="ep-text-button ex-message-jump" onClick={()=>{scrollToLatest();threadRef.current?.focus({preventScroll:true})}}>{tr("К последним сообщениям ", "Go to latest messages ")}<span aria-hidden="true">↓</span></button>}
    {outbox.some(m=>m.clientId===selected)&&<section className="communication-pending" aria-label={tr('Ожидают отправки','Awaiting delivery')}><h2>{tr('Ожидают отправки','Awaiting delivery')}</h2>{outbox.filter(m=>m.clientId===selected).map(m=><article key={m.id}><strong>{channelNames()[m.channel]} {m.address}</strong><p className="communication-prewrap">{m.text}</p>{m.files.map(f=><p key={f.id}>{f.name}</p>)}<button className="ep-text-button" onClick={()=>{setState(s=>({...s,drafts:{...s.drafts,[selected]:[s.drafts[selected],m.text].filter(Boolean).join('\n\n')}}));setFiles(f=>({...f,[selected]:[...(f[selected]||[]),...m.files]}));setOutbox(items=>items.filter(x=>x.id!==m.id))}}>{tr('Вернуть в черновик','Return to draft')}</button></article>)}</section>}
    <div className="ep-form ex-editor ex-message-composer">
     <label>{tr("Ваш ответ", "Your reply")}<textarea rows={3} value={state.drafts[selected]||''} placeholder={tr("Напишите ответ клиенту", "Write a reply to the client")} onChange={e=>draft(e.target.value)}/></label>
     <div className="ex-toolbar"><button className="ep-text-button" onClick={()=>{const template=client.unknownTime||!client.birthTime?birthTimeReply(client):tr(`${givenName(client.name)}, спасибо! Я учту ваш запрос «${client.request||tr("консультация", "consultation")}» при подготовке. Если есть дополнительные вопросы, напишите их здесь.`, `${givenName(client.name)}, thank you! I will keep your request “${client.request||tr("консультация", "consultation")}” in mind when preparing. If you have any other questions, please add them here.`);draft([state.drafts[selected]?.trim(),template].filter(Boolean).join('\n\n'))}}>{state.drafts[selected]?.trim()?tr("Добавить шаблон", "Add template"):tr("Вставить шаблон", "Insert template")}</button><span className="ep-muted">{failed?tr("Не сохранено", "Not saved"):state.drafts[selected]?tr("Черновик сохранён", "Draft saved"):tr("Черновик пуст", "Draft is empty")}</span></div>
     <Attachments value={files[selected]||[]} onChange={value=>setFiles(f=>({...f,[selected]:value}))}/><div className="ex-actions"><button className="ep-button ep-button--primary" disabled={!state.drafts[selected]?.trim()&&!files[selected]?.length} onClick={sendMessage}>{tr("Подготовить к отправке", "Prepare for delivery")}</button><button className="ep-text-button" onClick={()=>setMaterialPicker(true)}><Icon name="library"/>{tr("Добавить материал", "Add material")}</button></div>
    </div>
   </section>
  </>:<>
   <div className="ex-toolbar"><label className="ep-search"><Icon name="search"/><input aria-label={tr("Найти разговор", "Find a conversation")} placeholder={tr("Найти клиента", "Find a client")} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button type="button" aria-label={tr("Очистить поиск разговоров", "Clear conversation search")} onClick={()=>setSearch('')}><Icon name="close"/></button>}</label><div className="ex-tabs" aria-label={tr("Фильтр разговоров", "Conversation filter")}><button className={filter==='all'?'is-active':''} onClick={()=>setFilter('all')} aria-pressed={filter==='all'}>{tr("Все", "All")}</button><button className={filter==='reply'?'is-active':''} onClick={()=>setFilter('reply')} aria-pressed={filter==='reply'}>{tr("Ждут ответа", "Awaiting reply")}</button></div></div>
   {visible.length?<div className="ex-list">{visible.map(c=><button className="ex-row ex-message-row" key={c.id} onClick={()=>setSelected(c.id)}><div className="ex-message-row-body"><strong>{c.name}</strong>{threads[c.id]?.at(-1)&&<span className="ep-muted">{messageTimestamp(threads[c.id].at(-1)!)}</span>}<p className="ex-message-preview">{state.drafts[c.id]?tr("Черновик: ", "Draft: ")+state.drafts[c.id]:(threads[c.id]?.at(-1)?.text||tr("Начать разговор", "Start conversation"))}</p></div><span className="ex-status ex-message-row-status">{needsReply(c.id)?tr("Ждёт ответа", "Awaiting reply"):tr("Открыть", "Open")}</span><Icon name="arrow"/></button>)}</div>:<EmptyState icon="clients" action={(search||filter!=='all')?<button className="ep-button" onClick={()=>{setSearch('');setFilter('all')}}>{tr("Показать все разговоры", "Show all conversations")}</button>:<a className="ep-button ep-button--primary" href="#clients">{tr("Перейти к клиентам", "Go to clients")}</a>} title={search?tr("Ничего не найдено", "Nothing found"):filter==='reply'?tr("Все вопросы разобраны", "All questions answered"):tr("Пока нет клиентов", "No clients yet")}>{search?tr("Попробуйте другое имя.", "Try another name."):filter==='reply'?tr("Новые вопросы появятся здесь.", "New questions will appear here."):tr("Добавьте клиента в разделе «Клиенты», чтобы подготовить сообщение.", "Add a client in Clients to start a conversation.")}</EmptyState>}
  </>}
 </>
}
