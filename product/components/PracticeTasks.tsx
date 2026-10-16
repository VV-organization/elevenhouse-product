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
 return <section className="ep-data-tasks ep-work-tasks"><h2>Требуют внимания</h2>
 {awaiting>0&&<button onClick={onMessages}><Icon name="message" size={18}/><span><strong>Ответить клиентам</strong><small>Ждут ответа: {awaiting}</small></span><Icon name="arrow" size={16}/></button>}
 {unfinished.length>0&&<button onClick={()=>onMeeting(unfinished[0].id)}><Icon name="note" size={18}/><span><strong>Подвести итоги встреч</strong><small>Без итога: {unfinished.length}</small></span><Icon name="arrow" size={16}/></button>}
 {due>0&&<button onClick={onReminders}><Icon name="reminder" size={18}/><span><strong>Личные напоминания</strong><small>На сегодня и раньше: {due}</small></span><Icon name="arrow" size={16}/></button>}
 </section>
}
