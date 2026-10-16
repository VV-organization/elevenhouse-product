import {createContext,useContext,useEffect,useId,useState,type ReactNode} from 'react'
import {useModuleState} from '../modules/ModuleKit'
import {dismissLearning,finishLearning,initialLearning,showLearning,type LearningState} from '../state/learning'
import {Icon} from './Icon'
import '../learning.css'
const lessons:Record<string,{title:string,body:string}>={
 client:{title:'Сначала познакомимся с клиентом',body:'Введите имя и фамилию и нажмите «Добавить клиента». Данные рождения можно заполнить позже — они понадобятся для расчёта.'},
 appointment:{title:'Запишем клиента на встречу',body:'Выберите клиента и услугу, затем дату и время. После сохранения встреча появится в календаре и в карточке клиента.'},
 overview:{title:'Всё для этой консультации — здесь',body:'В «Карте» можно проверить данные и открыть расчёт. В «Заметках» — записать личные наблюдения. Кнопка «Переписка» откроет разговор именно с этим клиентом.'},
 calculations:{title:'Начните с данных рождения',body:'Выберите клиента — данные подставятся сами. Для отдельного расчёта выберите «Без добавления клиента». Если время неизвестно, отметьте это в форме.'},
 notes:{title:'Эти заметки видны только вам',body:'Запишите наблюдения — текст сохраняется автоматически. Итог конкретной консультации добавляется внутри встречи — так его легко найти по дате.'},
 outcome:{title:'Сохраним результат консультации',body:'Откройте встречу и выберите «Записать итог». Договорённости останутся у этой встречи. После сохранения можно записать клиента на следующую.'},
 messages:{title:'Ответ останется в этой переписке',body:'Выберите клиента, напишите текст и проверьте его перед отправкой. Пока вы пишете, текст сохраняется как черновик.'},
 calendar:{title:'Выберите день, затем встречу',body:'Выберите дату — увидите встречи этого дня. Для подготовки или переноса откройте нужную встречу.'},
 services:{title:'Услугу достаточно настроить один раз',body:'Укажите название, длительность и стоимость. При записи клиента эти данные подставятся автоматически — их можно будет изменить для отдельной встречи.'},
 library:{title:'Сохраните то, что используете повторно',body:'Добавьте памятку или текст в «Мои материалы». Откройте нужный материал, когда готовитесь к консультации.'},
 finance:{title:'Откройте платёж для подробностей',body:'Выберите операцию в списке: увидите сумму, комиссию и статус. Если платёж связан со встречей, из него можно сразу открыть эту встречу.'},
 content:{title:'Сначала черновик, потом публикация',body:'Создайте публикацию и сохраните текст. Планирование даты — отдельное действие: черновик не публикуется автоматически.'},
 automations:{title:'Начните с готового напоминания',body:'Выберите, когда подготовить сообщение. Отредактируйте текст и проверьте его на клиенте. Сценарий готовит черновик, который вы подтверждаете.'},
 'astro-calendar':{title:'Напоминания — для вас',body:'Выберите событие и укажите, когда о нём напомнить. Выполненное напоминание можно отметить — оно уйдёт из активных.'},
 reviews:{title:'Ответьте на отзыв',body:'Откройте отзыв, подготовьте ответ и сохраните. Сохранение не публикует его.'},
 settings:{title:'Настройки можно менять постепенно',body:'Имя и часовой пояс применяются кнопкой «Сохранить профиль». Тема меняется сразу.'},
 analytics:{title:'Посмотрите нужный период',body:'Выберите период, затем откройте клиента или операцию для подробностей.'},
 journal:{title:'Личные записи и итоги по клиенту',body:'Выберите клиента, чтобы увидеть его записи. Для ответа клиенту откройте переписку — личная заметка ему не отправляется.'}
}
type LearningContextValue={visible:(topic:string)=>boolean,isReplay:(topic:string)=>boolean,start:(topic:string)=>void,complete:(topic:string)=>void,dismiss:(topic:string)=>void,stop:()=>void,pause:()=>void}
const fallback:LearningContextValue={visible:()=>false,isReplay:()=>false,start:()=>{},complete:()=>{},dismiss:()=>{},stop:()=>{},pause:()=>{}}
const Context=createContext(fallback)
export function LearningProvider({children,isNew,example}:{children:ReactNode,isNew:boolean,example:boolean}){
 const [state,setState]=useModuleState<LearningState>('learning-v1',example,()=>initialLearning(isNew))
 const [replay,setReplay]=useState<{topic:string,route:string}|null>(null)
 useEffect(()=>{const leave=()=>setReplay(current=>current&&current.route!==window.location.hash?null:current);window.addEventListener('hashchange',leave);return()=>window.removeEventListener('hashchange',leave)},[])
 return <Context.Provider value={{pause:()=>setReplay(null),isReplay:topic=>replay?.topic===topic,visible:topic=>showLearning(state,topic,replay?.topic??null),start:topic=>setReplay({topic,route:window.location.hash}),complete:topic=>{setState(s=>finishLearning(s,topic));setReplay(r=>r?.topic===topic?null:r)},dismiss:topic=>{setState(s=>dismissLearning(s,topic));setReplay(r=>r?.topic===topic?null:r)},stop:()=>{setReplay(null);setState(s=>({...s,enabled:false}))}}}>{children}</Context.Provider>
}
export function useLearning(){return useContext(Context)}
export function LearningTip({topic,title,children}:{topic:string,title?:string,children?:ReactNode}){
 const learning=useLearning(),id=useId(),lesson=lessons[topic]
 if(!learning.visible(topic)||(!lesson&&!children))return null
 return <aside className="ep-learning-tip" aria-labelledby={id}><Icon name="help" size={20}/><div><strong id={id}>{title||lesson?.title}</strong><p>{children||lesson?.body}</p></div><button type="button" className="ep-icon-button" aria-label="Скрыть подсказку" onClick={()=>learning.dismiss(topic)}><Icon name="close" size={18}/></button></aside>
}
