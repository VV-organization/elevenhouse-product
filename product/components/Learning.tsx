import {tr} from '../i18n'
import {createContext,useContext,useEffect,useId,useState,type ReactNode} from 'react'
import {ModuleScopeContext,useModuleState} from '../modules/ModuleKit'
import {dismissLearning,finishLearning,initialLearning,showLearning,savedLearningTopics,type LearningState} from '../state/learning'
import {Icon} from './Icon'
import {beginTour,moveTour,pauseTour} from '../state/guidedTour'
import type {JourneyKind} from '../state/learningJourney'
import '../learning.css'
function getLessons():Record<string,{title:string,body:string}>{return {
 client:{title:tr("Сначала познакомимся с клиентом","Start with your client"),body:tr("Введите имя и фамилию и нажмите «Добавить клиента». Данные рождения можно заполнить позже — они понадобятся для расчёта.","Enter their first and last name and select “Add client”. You can add birth details later when you need a calculation.")},
 appointment:{title:tr("Запишем клиента на встречу","Book an appointment with your client"),body:tr("Выберите клиента и услугу, затем дату и время. После сохранения встреча появится в календаре и в карточке клиента.","Choose a client and service, then a date and time. Saving adds the appointment to your calendar and the client's profile.")},
 overview:{title:tr("Всё для этой консультации — здесь","Everything for this consultation is here"),body:tr("В «Карте» можно проверить данные и открыть расчёт. В «Заметках» — записать личные наблюдения. Кнопка «Переписка» откроет разговор именно с этим клиентом.","In “Chart”, check birth details and open a calculation. In “Notes”, record your private observations. “Messages” opens the conversation with this client.")},
 calculations:{title:tr("Начните с данных рождения","Start with birth details"),body:tr("Выберите клиента — данные подставятся сами. Для отдельного расчёта выберите «Без добавления клиента». Если время неизвестно, отметьте это в форме.","Choose a client to fill in their details. For a separate calculation, choose “Without adding a client”. If the birth time is unknown, mark it in the form.")},
 notes:{title:tr("Эти заметки видны только вам","Only you can see these notes"),body:tr("Запишите наблюдения — текст сохраняется автоматически. Итог конкретной консультации добавляется внутри встречи — так его легко найти по дате.","Write down your observations — your text saves automatically. Add the outcome of a consultation inside its appointment so it is easy to find by date.")},
 outcome:{title:tr("Сохраним результат консультации","Save your consultation outcome"),body:tr("Откройте встречу и выберите «Записать итог». Договорённости останутся у этой встречи. После сохранения можно записать клиента на следующую.","Open the appointment and select “Record outcome”. Your agreements stay with that appointment. After saving, you can schedule the next one.")},
 messages:{title:tr("Ответ останется в этой переписке","Your reply stays in this conversation"),body:tr("Выберите клиента, напишите текст и проверьте его перед отправкой. Пока вы пишете, текст сохраняется как черновик.","Choose a client, write your reply and check it before sending. Your text is saved as a draft while you type.")},
 calendar:{title:tr("Выберите день, затем встречу","Choose a day, then an appointment"),body:tr("Выберите дату — увидите встречи этого дня. Для подготовки или переноса откройте нужную встречу.","Select a date to see its appointments. Open an appointment to prepare for it or reschedule it.")},
 services:{title:tr("Услугу достаточно настроить один раз","Set up a service once"),body:tr("Укажите название, длительность и стоимость. При записи клиента эти данные подставятся автоматически — их можно будет изменить для отдельной встречи.","Enter a name, duration and price. These are filled in automatically when you schedule a client. You can change them for an individual appointment.")},
 library:{title:tr("Сохраните то, что используете повторно","Save what you use again"),body:tr("Добавьте памятку или текст в «Мои материалы». Откройте нужный материал, когда готовитесь к консультации.","Add a guide or text to “My materials”. Open it when preparing for a consultation.")},
 finance:{title:tr("Откройте платёж для подробностей","Open a payment to see its details"),body:tr("Выберите операцию в списке: увидите сумму, комиссию и статус. Если платёж связан со встречей, из него можно сразу открыть эту встречу.","Select a transaction to see its amount, fee and status. If it is linked to an appointment, you can open that appointment directly.")},
 content:{title:tr("Сначала черновик, потом публикация","Draft first, publish later"),body:tr("Создайте публикацию и сохраните текст. Планирование даты — отдельное действие: черновик не публикуется автоматически.","Create a post and save your text. Scheduling a date is a separate step: drafts are not published automatically.")},
 automations:{title:tr("Начните с готового напоминания","Start with a reminder template"),body:tr("Выберите, когда подготовить сообщение. Отредактируйте текст и проверьте его на клиенте. Сценарий готовит черновик, который вы подтверждаете.","Choose when to prepare a message. Edit its text and preview it for a client. The workflow prepares a draft for you to approve.")},
 'astro-calendar':{title:tr("Напоминания — для вас","These reminders are for you"),body:tr("Выберите событие и укажите, когда о нём напомнить. Выполненное напоминание можно отметить — оно уйдёт из активных.","Choose an event and set a reminder date. Mark a reminder as done to remove it from the active list.")},
 reviews:{title:tr("Ответьте на отзыв","Reply to a review"),body:tr("Откройте отзыв, подготовьте ответ и сохраните. Сохранение не публикует его.","Open a review, write a reply and save it. Saving does not publish the reply.")},
 settings:{title:tr("Настройки можно менять постепенно","You can update settings at any time"),body:tr("Имя и часовой пояс применяются кнопкой «Сохранить профиль». Тема меняется сразу.","Select “Save profile” to apply your name and time zone. Theme changes apply immediately.")},
 analytics:{title:tr("Посмотрите нужный период","Choose the period you need"),body:tr("Выберите период, затем откройте клиента или операцию для подробностей.","Select a period, then open a client or transaction for details.")},
 journal:{title:tr("Личные записи и итоги по клиенту","Private notes and outcomes by client"),body:tr("Выберите клиента, чтобы увидеть его записи. Для ответа клиенту откройте переписку — личная заметка ему не отправляется.","Choose a client to see their records. To reply to them, open Messages. Private notes are never sent to clients.")}
}}
type LearningContextValue={state:LearningState,beginTour:(id:string,explicit?:boolean)=>void,moveTour:(direction:1|-1)=>void,pauseTour:()=>void,failed:boolean,replaying:boolean,trackAppointment:(id:string)=>void,resumeJourney:(id?:string)=>void,workOnJourney:(kind:JourneyKind)=>void,deferJourney:()=>void,skipJourney:(kind:JourneyKind)=>void,visible:(topic:string)=>boolean,isReplay:(topic:string)=>boolean,start:(topic:string)=>void,complete:(topic:string)=>void,dismiss:(topic:string)=>void,stop:()=>void,pause:()=>void}
const fallback:LearningContextValue={state:initialLearning(false),beginTour:()=>{},moveTour:()=>{},pauseTour:()=>{},failed:false,replaying:false,trackAppointment:()=>{},resumeJourney:()=>{},workOnJourney:()=>{},deferJourney:()=>{},skipJourney:()=>{},visible:()=>false,isReplay:()=>false,start:()=>{},complete:()=>{},dismiss:()=>{},stop:()=>{},pause:()=>{}}
const Context=createContext(fallback)
export function LearningProvider({children,isNew,example}:{children:ReactNode,isNew:boolean,example:boolean}){
 const [state,setState,failed]=useModuleState<LearningState>('learning-v1',example,()=>initialLearning(isNew))
 const [replay,setReplay]=useState<{topic:string,route:string}|null>(null)
 useEffect(()=>{const leave=()=>setReplay(current=>current&&current.route!==window.location.hash?null:current);window.addEventListener('hashchange',leave);return()=>window.removeEventListener('hashchange',leave)},[])
 const value:LearningContextValue={
  state,failed,replaying:!!replay,
  beginTour:(id,explicit)=>{setReplay(null);setState(s=>beginTour(s,id,explicit))},
  moveTour:direction=>setState(s=>moveTour(s,direction)),
  pauseTour:()=>setState(pauseTour),
  trackAppointment:id=>setState(s=>!s.enabled||s.journey?.appointmentId?s:{...s,journey:{...s.journey,appointmentId:id}}),
  resumeJourney:id=>{setReplay(null);setState(s=>({...s,enabled:true,journey:{...(id&&s.journey?.appointmentId!==id?{}:s.journey),...(id?{appointmentId:id}:{}),paused:false}}))},
  workOnJourney:kind=>setState(s=>({...s,journey:{...s.journey,working:kind}})),
  deferJourney:()=>setState(s=>({...s,journey:{...s.journey,paused:true}})),
  skipJourney:kind=>setState(s=>({...s,journey:{...s.journey,skipped:[...new Set([...(s.journey?.skipped||[]),kind,...(kind==='birth'?['calculation' as const]:[])])]}})),
  pause:()=>setReplay(null),
  isReplay:topic=>replay?.topic===topic,
  visible:topic=>state.tour?.status==='active'?false:showLearning({...state,enabled:state.enabled&&!state.tour&&!state.journey?.paused},topic,replay?.topic??null),
  start:topic=>{setState(pauseTour);setReplay({topic,route:window.location.hash})},
  complete:topic=>{setState(s=>finishLearning(s,topic));setReplay(r=>r?.topic===topic?null:r)},
  dismiss:topic=>{setState(s=>dismissLearning(s,topic));setReplay(r=>r?.topic===topic?null:r)},
  stop:()=>{setReplay(null);setState(s=>({...pauseTour(s),enabled:false}))},
 }
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useLearning(){return useContext(Context)}
/** Runs after useModuleState's write effect and verifies the actual persisted value. */
export function useSavedLearning<T>(key:string,example:boolean,value:T,topics:(saved:T)=>string[]){
 const learning=useLearning(),scope=useContext(ModuleScopeContext)
 const storageKey=`eh-product-v2-${scope??(example?'example':'mine')}-${key}`
 useEffect(()=>{try{savedLearningTopics(localStorage.getItem(storageKey),value,topics(value)).forEach(learning.complete)}catch{/* The owning form already reports its storage error. */}},[value,storageKey])
}
/** Keep one visible instruction while the journey or a dialog owns attention. */
export function LearningSurface({quiet,children}:{quiet:boolean,children:ReactNode}){const learning=useLearning();return <Context.Provider value={quiet?{...learning,visible:()=>false}:learning}>{children}</Context.Provider>}
export function LearningTip({topic,title,children}:{topic:string,title?:string,children?:ReactNode}){
 const learning=useLearning(),id=useId(),lesson=getLessons()[topic]
 if(!learning.visible(topic)||(!lesson&&!children))return null
 return <aside className="ep-learning-tip" aria-labelledby={id}><Icon name="help" size={20}/><div><strong id={id}>{title||lesson?.title}</strong><p>{children||lesson?.body}</p></div><button type="button" className="ep-icon-button" aria-label={tr("Скрыть подсказку","Hide tip")} onClick={()=>learning.dismiss(topic)}><Icon name="close" size={18}/></button></aside>
}
