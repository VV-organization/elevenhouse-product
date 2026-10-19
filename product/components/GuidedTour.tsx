import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {tr} from '../i18n'
import {tourSteps,type TourStep} from '../state/guidedTour'
import {Icon} from './Icon'
import './guided-tour.css'

type Props={step:TourStep;index:number;clientName:string;selector:string;onMove:(direction:1|-1)=>void;onPause:()=>void;onShow:()=>void;failed:boolean}
function copy(step:TourStep,name:string):[string,string]{
 const content:Record<TourStep,[string,string]>={
  booking:[tr('Клиент записан. Что дальше?','Your client is booked. What’s next?'),tr(`Запись сохранена. Клиент: ${name}. Сейчас пройдём по шагам: подготовка, консультация и дальнейшая работа. Нажмите «Дальше» — откроем карточку клиента.`,`Your appointment with ${name} is in the calendar. Let’s walk through preparation, the consultation and follow-up. Select Next to open the client’s profile.`)],
  client:[tr('Здесь всё об этом клиенте','Everything about this client'),tr('Нажмите «Изменить данные и запрос», чтобы сохранить, с чем человек к вам пришёл. Здесь же — его встречи и контакты. Дальше посмотрим расчёты.','Select “Edit details and request” to record why they came to you. Their appointments and contacts are here too. Next, let’s see calculations.')],
  chart:[tr('Подготовьте расчёт к встрече','Prepare a calculation'),tr('Введите данные рождения и сохраните их. Затем выберите метод расчёта. Это можно сделать позже — «Дальше» покажет, где вести заметки.','Enter and save birth details, then choose a calculation method. You can do this later — Next shows where to keep your notes.')],
  notes:[tr('Запишите, что важно помнить','Write down what matters'),tr('Личные наблюдения можно писать прямо здесь: они сохраняются автоматически и видны только вам. Дальше — разговор с этим же клиентом.','Write your private observations here. They save automatically and are visible only to you. Next is this client’s conversation.')],
  messages:[tr('Продолжайте разговор здесь','Continue the conversation here'),tr('Это переписка выбранного клиента. Напишите ответ, приложите материал и проверьте получателя. Черновик сохраняется; отправка — отдельное действие.','This is the selected client’s conversation. Write a reply, attach a material and check the recipient. Drafts are saved; delivery is a separate action.')],
  library:[tr('Соберите материалы для клиентов','Keep your client materials together'),tr('Через «Добавить материал» сохраните памятку или текст, который используете повторно. Потом его можно выбрать в переписке. Дальше вернёмся к самой встрече.','Use “Add material” to save a guide or reusable text. You can then select it in a conversation. Next, let’s return to the appointment.')],
  meeting:[tr('Проведите встречу и сохраните итог','Meet and keep the outcome'),tr('Здесь можно открыть пространство консультации, добавить видеоссылку или перенести встречу. Когда консультация пройдёт, сохраните итог — он останется в истории клиента.','Open the consultation workspace, add a video link or reschedule here. After the consultation, save its outcome to the client’s history.')],
  finance:[tr('Проверяйте оплату встречи','Check appointment payments'),tr('В оплатах видны сумма и статус. Получение денег отмечайте только после фактической оплаты. Кнопка «Дальше» просто продолжит знакомство.','Payments show the amount and status. Record receipt only after payment actually arrives. Next simply continues the tour.')],
  reminders:[tr('Не теряйте следующий шаг','Remember the next step'),tr('Выберите встречу или добавьте важную дату, чтобы настроить напоминание. Здесь можно спланировать, когда вернуться к клиенту.','Select an appointment or add an important date to set a reminder. Plan when to follow up with the client here.')],
  services:[tr('Настройте то, что предлагаете','Set up what you offer'),tr('Добавьте услугу с названием, длительностью и стоимостью. При следующей записи эти условия подставятся сами — каждый раз вводить их заново не придётся.','Add a service with a name, duration and price. Its terms will be filled in automatically for the next booking.')],
  automations:[tr('Повторяющиеся действия — в сценарии','Set up recurring actions'),tr('Здесь настраиваются последовательности действий для работы с клиентами. Откройте сценарий, проверьте условия и подключение отправки перед запуском.','Set up sequences of client actions here. Open a workflow and check its conditions and delivery connection before enabling it.')],
  dashboard:[tr('Посмотрите на практику целиком','See your whole practice'),tr('На дашборде собраны показатели и текущие задачи. По мере работы здесь появятся ваши данные. А ежедневное расписание всегда доступно в «Сегодня».','The dashboard brings together your metrics and current tasks. Your data will appear as you work. Your daily schedule is always available in Today.')],
  directory:[tr('Остальные возможности — здесь','Find the other tools here'),tr('В «Все разделы» находятся остальные инструменты: методы расчётов, дневник, публикации, отзывы и настройки. Открывайте нужный раздел по своей задаче.','All sections contains the remaining tools: calculation methods, journal, posts, reviews and settings. Open the section you need for your task.')],
  finish:[tr('Теперь можно работать самостоятельно','You’re ready to continue'),tr('Вы прошли путь от записи клиента до управления практикой. Вернёмся к расписанию. Если понадобится подсказка, откройте «Помощь» — знакомство можно повторить в любой момент.','You’ve explored the path from booking a client to managing your practice. Let’s return to the schedule. Open Help whenever you want to repeat this tour.')],
 }
 return content[step]
}
const visible=(el:Element)=>!!el.getClientRects().length
export function GuidedTour({step,index,clientName,selector,onMove,onPause,onShow,failed}:Props){
 const layer=useRef<HTMLDivElement>(null),card=useRef<HTMLElement>(null),next=useRef<HTMLButtonElement>(null)
 const callbacks=useRef({onPause});callbacks.current={onPause}
 const [host,setHost]=useState<Element|null>(null),[blocked,setBlocked]=useState(false),[missing,setMissing]=useState(false)
 const [position,setPosition]=useState({left:16,top:16,x:0,y:0,width:0,height:0,ready:false})
 const dirtyForms=useRef(new Set<HTMLFormElement>())
 useEffect(()=>{
  const root=document.querySelector('.ep-root');root?.classList.add('ep-tour-active')
  let frame=0
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const dialogs=Array.from(document.querySelectorAll('dialog[open]')).filter(visible)
   const dialog=dialogs.at(-1)
   setHost(dialog||document.querySelector('.ep-workspace'))
   for(const form of dirtyForms.current)if(!form.isConnected||!visible(form)||form.dataset.tourDraft==='saved')dirtyForms.current.delete(form)
   document.querySelectorAll<HTMLFormElement>('form[data-tour-draft=unsaved]').forEach(form=>{if(visible(form))dirtyForms.current.add(form)})
   setBlocked(!!dialog&&Array.from(dialog.querySelectorAll('form')).some(visible)||dirtyForms.current.size>0)
  })}
  const edit=(event:Event)=>{const form=(event.target as HTMLElement).closest('form');if(form&&form.dataset.tourDraft!=='saved')dirtyForms.current.add(form);update()}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();callbacks.current.onPause()}}
  const observer=new MutationObserver(records=>{if(records.some(r=>!(r.target as Element).closest?.('.ep-tour-layer')))update()})
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','data-tour-draft']})
  document.addEventListener('input',edit,true);document.addEventListener('change',edit,true);document.addEventListener('keydown',escape,true);update()
  return()=>{root?.classList.remove('ep-tour-active');observer.disconnect();cancelAnimationFrame(frame);document.removeEventListener('input',edit,true);document.removeEventListener('change',edit,true);document.removeEventListener('keydown',escape,true)}
 },[])
 useLayoutEffect(()=>{
  const node=layer.current
  if(!node)return
  node.showPopover?.()
  return()=>{if(node.matches(':popover-open'))node.hidePopover?.()}
 },[host])
 useLayoutEffect(()=>{
  if(!host||!card.current)return
  let frame=0,initial=true,lastTarget:Element|null=null
  const measure=()=>{
   const dialog=host.matches('dialog')?host:null
   const target=(dialog?.querySelector('form')||dialog?.querySelector('.ep-meeting-room')||dialog?.querySelector('.ep-dialog-body')||Array.from(document.querySelectorAll<HTMLElement>(selector)).find(visible)) as HTMLElement|undefined
   setMissing(!target)
   const anchor=target||document.querySelector<HTMLElement>('#ep-main h1')
   if(!anchor)return
   const changed=anchor!==lastTarget
   if(changed){lastTarget=anchor;resize.observe(anchor);anchor.scrollIntoView({block:'center',behavior:'instant'})}
   const viewport=window.visualViewport,w=viewport?.width||innerWidth,h=viewport?.height||innerHeight,offsetY=viewport?.offsetTop||0
   const rect=anchor.getBoundingClientRect(),box=card.current!.getBoundingClientRect(),padding=12
   const mobile=w<700,cw=Math.min(376,w-padding*2),ch=box.height
   let left=rect.right+20,top=rect.top
   if(mobile){left=padding;top=blocked?padding+offsetY:h-ch-padding+offsetY
    if(changed&&!dialog&&!blocked){const desired=Math.max(80,(top-Math.min(rect.height,240))/2);window.scrollBy({top:rect.top-desired,behavior:'instant'});schedule();return}
   }
   else if(left+cw>w-padding){left=Math.max(padding,Math.min(rect.left,w-cw-padding));top=rect.bottom+18;if(top+ch>h-padding)top=rect.top-ch-18}
   top=Math.max(padding+offsetY,Math.min(top,h-ch-padding+offsetY))
   const y=Math.max(padding+offsetY,rect.top-6),bottom=Math.min(h-padding+offsetY,mobile&&!blocked?top-14:h-padding+offsetY,rect.bottom+6)
   const value={left,top,x:Math.max(6,rect.left-6),y,width:Math.min(w-12,rect.width+12),height:Math.max(0,bottom-y),ready:true}
   setPosition(old=>Object.keys(value).every(k=>old[k as keyof typeof old]===value[k as keyof typeof value])?old:value)
   if(initial){initial=false;next.current?.focus({preventScroll:true})}
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)}
  const resize=new ResizeObserver(schedule);resize.observe(card.current)
  const observer=new MutationObserver(records=>{if(records.some(r=>!(r.target as Element).closest?.('.ep-tour-layer')))schedule()})
  observer.observe(host,{subtree:true,childList:true})
  window.addEventListener('resize',schedule);document.addEventListener('scroll',schedule,true);window.visualViewport?.addEventListener('resize',schedule);schedule()
  return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();window.removeEventListener('resize',schedule);document.removeEventListener('scroll',schedule,true);window.visualViewport?.removeEventListener('resize',schedule)}
 },[host,selector,index,blocked])
 const [title,body]=copy(step,clientName)
 if(!host)return null
 return createPortal(<div ref={layer} popover="manual" className="ep-tour-layer">
  {position.ready&&position.height>0&&<div key={`ring-${index}`} className="ep-tour-spotlight" aria-hidden="true" style={{left:position.x,top:position.y,width:position.width,height:position.height}}/>}
  <section key={index} ref={card} className={`ep-tour-card${blocked?' is-editing':''}`} data-tour-step={step} role="dialog" aria-modal="false" aria-labelledby="ep-tour-title" aria-describedby="ep-tour-description" style={{left:position.left,top:position.top,visibility:position.ready?'visible':'hidden'}}>
   <div className="ep-tour-top"><span aria-live="polite">{tr(`Шаг ${index+1} из ${tourSteps.length}`,`Step ${index+1} of ${tourSteps.length}`)}</span><button className="ep-icon-button" aria-label={tr('Продолжить знакомство позже','Continue tour later')} onClick={onPause}><Icon name="close" size={18}/></button></div>
   <div className="ep-tour-progress" aria-hidden="true"><span style={{width:`${(index+1)/tourSteps.length*100}%`}}/></div>
   <h2 id="ep-tour-title">{title}</h2><p id="ep-tour-description">{body}</p>
   {blocked&&<p className="ep-tour-hint" role="status">{tr('Сохраните или закройте открытую форму — затем продолжим.','Save or close the open form to continue.')}</p>}
   {missing&&!blocked&&<button className="ep-text-button" onClick={onShow}>{tr('Показать этот шаг','Show this step')}</button>}
   {failed&&<p role="alert">{tr('Прогресс не сохранился в браузере. После обновления шаг может повториться.','Progress could not be saved. This step may repeat after a reload.')}</p>}
   <footer><button className="ep-text-button" onClick={onPause}>{tr('Позже','Later')}</button><div>{index>0&&<button className="ep-button" disabled={blocked} onClick={()=>onMove(-1)}>{tr('Назад','Back')}</button>}<button ref={next} className="ep-button ep-button--primary" disabled={blocked} onClick={()=>onMove(1)}>{step==='finish'?tr('Завершить','Finish'):tr('Дальше','Next')}<Icon name="arrow" size={17}/></button></div></footer>
  </section>
 </div>,host)
}
