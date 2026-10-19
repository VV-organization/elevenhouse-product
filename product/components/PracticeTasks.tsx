import {tr} from '../i18n'
import {useModuleState} from '../modules/ModuleKit'
import {initialConversations} from '../modules/Communication'
import {messageOrderKey} from '../state/ordering'
import {TODAY,type Practice} from '../state/model'
import {Icon} from './Icon'
export function PracticeTasks({practice,onMeeting,onMessages,onReminders}:{practice:Practice,onMeeting:(id:string)=>void,onMessages:()=>void,onReminders:()=>void}){
 const [conversations]=useModuleState('conversations',practice.isExample,()=>initialConversations(practice))
 const [reminders]=useModuleState<Array<{id:string,date:string,done:boolean}>>('reminders',practice.isExample,()=>[])
 const awaiting=practice.clients.filter(client=>[...(conversations.threads[client.id]||[])].sort((a,b)=>messageOrderKey(a).localeCompare(messageOrderKey(b))).at(-1)?.from==='client').length
 const unfinished=practice.appointments.filter(a=>a.status==='confirmed'&&a.date<TODAY).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time))
 const due=reminders.filter(r=>!r.done&&r.date<=TODAY).length
 if(!awaiting&&!unfinished.length&&!due)return null
 return <section className="ep-data-tasks ep-work-tasks"><h2>{tr("Требуют внимания","Needs attention")}</h2>
 {awaiting>0&&<button onClick={onMessages}><Icon name="message" size={18}/><span><strong>{tr("Ответить клиентам","Reply to clients")}</strong><small>{tr("Ждут ответа: ","Awaiting a reply: ")}{awaiting}</small></span><Icon name="arrow" size={16}/></button>}
 {unfinished.length>0&&<button onClick={()=>onMeeting(unfinished[0].id)}><Icon name="note" size={18}/><span><strong>{tr("Подвести итоги встреч","Record appointment outcomes")}</strong><small>{tr("Без итога: ","Without an outcome: ")}{unfinished.length}</small></span><Icon name="arrow" size={16}/></button>}
 {due>0&&<button onClick={onReminders}><Icon name="reminder" size={18}/><span><strong>{tr("Личные напоминания","Personal reminders")}</strong><small>{tr("На сегодня и раньше: ","Due today or earlier: ")}{due}</small></span><Icon name="arrow" size={16}/></button>}
 </section>
}
