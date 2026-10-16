import {tr, LanguageControl} from '../i18n'
import './section-directory.css'
import {LearningTip} from '../components/Learning'
import {useState,type Dispatch,type SetStateAction} from 'react'
import {ServicesFinance} from './ServicesFinance'
import {Communication} from './Communication'
import {Tools} from './Tools'
import {SectionHeader,useModuleState,Notice,type ModuleProps} from './ModuleKit'
import type {Practice} from '../state/model'
import {Icon} from '../components/Icon'
const groups = () => [
 {id:'consultations',title:tr("Для консультаций", "Consultation tools"),items:[['tools','chart',tr("Расчёты", "Calculations")],['journal','note',tr("Заметки и итоги", "Notes and outcomes")],['library','library',tr("Мои материалы", "My materials")]]},
 {id:'income',title:tr("Услуги и оплаты", "Services and payments"),items:[['services','service',tr("Услуги и цены", "Services and prices")],['finance','wallet',tr("Оплаты", "Payments")],['analytics','analytics',tr("Аналитика", "Analytics")]]},
 {id:'reminders',title:tr("Напоминания", "Reminders"),items:[['astro-calendar','reminder',tr("Личные задачи и даты", "Tasks and dates")],['automations','flow',tr("Автоматические напоминания", "Automatic reminders")]]},
 {id:'promotion',title:tr("Продвижение", "Promotion"),items:[['content','publication',tr("Публикации", "Posts")],['reviews','star',tr("Отзывы", "Reviews")]]},
]
const items = () => [...groups().flatMap(group=>group.items), ['settings','settings',tr("Настройки профиля", "Profile settings")]]

function SectionDirectory() {
 return <div className="ep-directory">
  <SectionHeader title={tr("Все разделы", "All sections")}/>
  <div className="ep-directory-groups">
   {groups().map(group=><section className="ep-directory-group" key={group.id} aria-labelledby={`directory-${group.id}`}>
    <h2 id={`directory-${group.id}`}>{group.title}</h2>
    <ul>
     {group.items.map(([id,icon,title])=><li key={id}>
      <a className="ep-directory-link" href={`#${id}`}>
       <Icon name={icon} size={24}/><span>{title}</span><Icon name="arrow" size={18}/>
      </a>
     </li>)}
    </ul>
   </section>)}
  </div>
  <div className="ep-directory-settings">
   <a className="ep-directory-link" href="#settings"><Icon name="settings" size={24}/><span>{tr("Настройки профиля", "Profile settings")}</span><Icon name="arrow" size={18}/></a>
  </div>
 </div>
}

export const extendedSections=['practice','services','finance','analytics','messages','content','automations','reviews','tools','journal','astro-calendar','library','settings']
export function ExtendedArea({page,practice,onOpenClient,onChange,theme,onThemeChange,onClientPreview}:{page:string,onChange:Dispatch<SetStateAction<Practice>>,theme:string,onThemeChange:(theme:'dark'|'light')=>void,onClientPreview:()=>void}&ModuleProps){
 if(page==='practice')return <SectionDirectory/>
 const back=!['messages','tools'].includes(page)&&items().some(i=>i[0]===page)?'practice':''
 return <>{!['tools','journal'].includes(page)&&<LearningTip topic={page}/>} {back&&<a href={`#${back}`} className="ex-section-back"><Icon name="back" size={16}/>{back==='practice'?tr("Все разделы", "All sections"):tr("Все инструменты", "All tools")}</a>}{['services','finance','analytics'].includes(page)?<ServicesFinance key={page} section={page as 'services'} practice={practice} onOpenClient={onOpenClient}/>:['messages','content','automations','reviews'].includes(page)?<Communication key={page} section={page as 'messages'} practice={practice} onOpenClient={onOpenClient}/>:['tools','journal','astro-calendar','library'].includes(page)?<Tools key={page} section={page as 'tools'} onChange={onChange} practice={practice} onOpenClient={onOpenClient}/>:<Settings practice={practice} onChange={onChange} theme={theme} onThemeChange={onThemeChange} onClientPreview={onClientPreview}/>}</>
}
function Settings({practice,onChange,theme,onThemeChange,onClientPreview}:{practice:Practice,onChange:Dispatch<SetStateAction<Practice>>,theme:string,onThemeChange:(value:'dark'|'light')=>void,onClientPreview:()=>void}){
 const [prefs,setPrefs]=useModuleState('settings',practice.isExample,()=>({appointments:true,messages:true,news:false}))
 const [notice,setNotice]=useState(''),[profileError,setProfileError]=useState('')
 const [draft,setDraft,draftFailed]=useModuleState('practice-profile-draft',practice.isExample,()=>({name:practice.profile.name,zone:practice.profile.timeZone}))
 const name=draft.name,zone=draft.zone,dirty=name!==practice.profile.name||zone!==practice.profile.timeZone
 const setName=(name:string)=>{setDraft(p=>({...p,name}));setProfileError('')},setZone=(zone:string)=>setDraft(p=>({...p,zone}))
 return <><SectionHeader title={tr("Настройки профиля", "Profile settings")}/>{notice&&<Notice>{notice}</Notice>}<div className="ex-settings-grid"><section><h2>{tr("Профиль практики", "Practice profile")}</h2><form className="ex-editor" onSubmit={e=>{e.preventDefault();if(!name.trim()){setProfileError(tr("Укажите ваше имя.", "Enter your name."));return}onChange(p=>({...p,profile:{name:name.trim(),timeZone:zone}}));setDraft({name:name.trim(),zone});setProfileError('');setNotice(tr("Профиль сохранён. Новые записи отображаются в выбранном часовом поясе.", "Profile saved. New appointments use the selected time zone."))}}><label>{tr("Ваше имя", "Your name")}<input value={name} required onChange={e=>setName(e.target.value)}/></label><label>{tr("Часовой пояс", "Time zone")}<select value={zone} onChange={e=>setZone(e.target.value)}>{[...new Set([practice.profile.timeZone,'Europe/Moscow','Asia/Yekaterinburg','Asia/Novosibirsk','Europe/Berlin','UTC'])].map(z=><option key={z}>{z}</option>)}</select></label><p className="ex-note">{tr("Часовой пояс расписания. Время уже созданных встреч останется прежним.", "The time zone for your schedule. Existing appointment times will not change.")}</p><p className="ex-note">{draftFailed?tr("Не удалось сохранить черновик.", "Could not save draft."):dirty?tr("Изменения сохранены как черновик. Примените их кнопкой ниже.", "Changes are saved as a draft. Apply them using the button below."):tr("Профиль сохранён.", "Profile saved.")}</p>{profileError&&<Notice error>{profileError}</Notice>}<div className="ex-actions"><button className="ep-button ep-button--primary">{tr("Сохранить профиль", "Save profile")}</button>{dirty&&<button type="button" className="ep-text-button" onClick={()=>{setDraft({name:practice.profile.name,zone:practice.profile.timeZone});setProfileError('')}}>{tr("Отменить изменения", "Discard changes")}</button>}</div></form></section><section><h2>{tr("Внешний вид", "Appearance")}</h2><LanguageControl/><label className="ex-setting-row">{tr("Тема интерфейса", "Theme")}<select value={theme} onChange={e=>onThemeChange(e.target.value as 'dark'|'light')}><option value="dark">{tr("Ночная", "Dark")}</option><option value="light">{tr("Светлая", "Light")}</option></select></label><div className="ex-actions"><button className="ep-button" onClick={onClientPreview}>{tr("Посмотреть кабинет клиента ", "View client portal ")}<Icon name="arrow"/></button></div></section><section><h2>{tr("Уведомления", "Notifications")}</h2>{[['appointments',tr("О новых записях", "New appointments")],['messages',tr("О сообщениях клиентов", "Client messages")],['news',tr("Новости сервиса", "Product news")]].map(([key,label])=><label className="ex-setting-row" key={key}>{label}<input type="checkbox" checked={prefs[key as keyof typeof prefs]} onChange={e=>setPrefs(p=>({...p,[key]:e.target.checked}))}/></label>)}</section><section><h2>{tr("Тариф и оплата", "Plan and billing")}</h2><p className="ex-note">{tr("Вам доступны все разделы для управления практикой.", "You have access to all sections for managing your practice.")}</p><dl className="ex-detail"><div><dt>{tr("Списания", "Charges")}</dt><dd>{tr("Отсутствуют", "None")}</dd></div><div><dt>{tr("Комиссия сервиса", "Service fee")}</dt><dd>4%</dd></div></dl><a className="ep-button" href="#finance">{tr("История операций ", "Transaction history ")}<Icon name="arrow"/></a></section></div></>
}
