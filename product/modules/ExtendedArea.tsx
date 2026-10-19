import type {ProductData} from '../state/product-data'
import {SettingsCapabilities} from './SettingsCapabilities'
import {PublicProfile} from './PublicProfile'
import {timeZoneLabel} from '../components/timeZoneLabel'
import {Select} from '../components/Select'
import {tr, LanguageControl} from '../i18n'
import './section-directory.css'
import './profile-settings-layout.css'
import {LearningTip} from '../components/Learning'
import {useState,type Dispatch,type SetStateAction} from 'react'
import {ServicesFinance} from './ServicesFinance'
import {Communication} from './Communication'
import {Tools} from './Tools'
import {SectionHeader,useModuleState,Notice,type ModuleProps} from './ModuleKit'
import type {Practice} from '../state/model'
import {Icon} from '../components/Icon'
const groups = () => [
 {id:'clients',title:tr('Работа с клиентами','Client work'),items:[['clients','clients',tr('Клиенты','Clients')],['calendar','calendar',tr('Календарь','Calendar')],['messages','message',tr('Сообщения','Messages')]]},
 {id:'practice',title:tr('Практика','Practice'),items:[['dashboard','analytics',tr('Обзор практики','Practice overview')],['today','today',tr('Сегодня · рабочий день','Today · working day')],['analytics','analytics',tr('Аналитика','Analytics')],['finance','wallet',tr('Финансы','Finance')]]},
 {id:'calculations',title:tr('Расчёты','Calculations'),items:[['tools','chart',tr('Астрология','Astrology')],['numbers','menu',tr('Нумерология','Numerology')],['matrix','practice',tr('Матрица судьбы','Destiny matrix')],['hd','profile',tr('Дизайн человека','Human Design')]]},
 {id:'consultations',title:tr('Для консультаций','Consultation tools'),items:[['astro-calendar','reminder',tr('Астрокалендарь и задачи','Astro calendar and tasks')],['astro-journal','pin',tr('Астродневник','Astro journal')],['journal','note',tr('Заметки и итоги','Notes and outcomes')],['reference','help',tr('Справочник','Reference library')],['library','library',tr('Мои материалы','My materials')]]},
 {id:'business',title:tr('Продажи и продвижение','Sales and promotion'),items:[['services','service',tr('Продукты и услуги','Products and services')],['automations','flow',tr('Воронки и автоматизация','Funnels and automation')],['content','publication',tr('Контент','Content')],['public-profile','profile',tr('Личная страница','Public profile')],['reviews','star',tr('Отзывы','Reviews')]]},
]
const items = () => [...groups().flatMap(group=>group.items), ['settings','settings',tr("Настройки профиля", "Profile settings")]]

function SectionDirectory({business=false}:{business?:boolean}) {
 return <div className="ep-directory">
  <SectionHeader title={business?tr("Моя практика","My practice"):tr("Все разделы", "All sections")}/>
  <div className="ep-directory-groups">
   {groups().filter(group=>!business||['practice','business'].includes(group.id)).map(group=><section className="ep-directory-group" key={group.id} aria-labelledby={`directory-${group.id}`}>
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
   <a className="ep-directory-link" href="#plans"><Icon name="lock" size={24}/><span>{tr("Тарифы · Старт, Pro, Studio", "Plans · Start, Pro, Studio")}</span><Icon name="arrow" size={18}/></a>
  </div>
 </div>
}

export const extendedSections=['business','practice','services','finance','analytics','messages','content','automations','reviews','tools','journal','astro-calendar','library','settings','public-profile','numbers','matrix','hd','astro-journal','reference','plans']
export function ExtendedArea({data,page,practice,onOpenClient,onChange,theme,onThemeChange,onClientPreview}:{data?:ProductData,page:string,onChange:Dispatch<SetStateAction<Practice>>,theme:string,onThemeChange:(theme:'dark'|'light')=>void,onClientPreview:(serviceId?:string)=>void}&ModuleProps){
 if(page==='practice'||page==='business')return <SectionDirectory business={page==='business'}/>
 if(page==='plans')return <><a className="ex-section-back" href="#practice">{tr('Все разделы','All sections')}</a><SectionHeader title={tr('Тарифы и доступ','Plans and access')}/><SettingsCapabilities key="plans" initialTab="billing" data={data?.settings} practice={practice} onOpenClient={onOpenClient}/></>
 const calculationMethod=({numbers:'numbers',matrix:'matrix',hd:'hd'} as const)[page as 'numbers'|'matrix'|'hd']
 if(calculationMethod)return <><a className="ex-section-back" href="#practice">{tr('Все разделы','All sections')}</a><Tools {...data?.calculations} key={page} method={calculationMethod} section="tools" onChange={onChange} practice={practice} onOpenClient={onOpenClient}/></>
 if(page==='astro-journal'||page==='reference')return <><a className="ex-section-back" href="#practice">{tr('Все разделы','All sections')}</a><Tools {...data?.calculations} key={page} initialView="additional" section={page==='astro-journal'?'journal':'library'} onChange={onChange} practice={practice} onOpenClient={onOpenClient}/></>
 if(page==='public-profile')return <><a className="ex-section-back" href="#practice">{tr('Все разделы','All sections')}</a><PublicProfile ownChartResult={data?.publicOwnChart} practice={practice} onOpenClient={onOpenClient} onBookService={onClientPreview}/></>
 const back=!['messages','tools'].includes(page)&&items().some(i=>i[0]===page)?'practice':''
 return <>{!['tools','journal'].includes(page)&&<LearningTip topic={page}/>} {back&&<a href={`#${back}`} className="ex-section-back"><Icon name="back" size={16}/>{back==='practice'?tr("Все разделы", "All sections"):tr("Все инструменты", "All tools")}</a>}{['services','finance','analytics'].includes(page)?<ServicesFinance key={page} section={page as 'services'} practice={practice} onOpenClient={onOpenClient} onChange={onChange}/>:['messages','content','automations','reviews'].includes(page)?<Communication data={data?.communication} key={page} section={page as 'messages'} practice={practice} onOpenClient={onOpenClient}/>:['tools','journal','astro-calendar','library'].includes(page)?<Tools {...data?.calculations} key={page} initialView={page==='astro-calendar'&&new URL(window.location.href).searchParams.get('reminders')!=='active'?'additional':'primary'} section={page as 'tools'} onChange={onChange} practice={practice} onOpenClient={onOpenClient}/>:<Settings data={data?.settings} onOpenClient={onOpenClient} practice={practice} onChange={onChange} theme={theme} onThemeChange={onThemeChange} onClientPreview={onClientPreview}/>}</>
}
function Settings({data,practice,onChange,theme,onThemeChange,onClientPreview,onOpenClient}:{data?:ProductData['settings'],onOpenClient:(id:string)=>void,practice:Practice,onChange:Dispatch<SetStateAction<Practice>>,theme:string,onThemeChange:(value:'dark'|'light')=>void,onClientPreview:(serviceId?:string)=>void}){
 const [notice,setNotice]=useState(''),[profileError,setProfileError]=useState('')
 const [draft,setDraft,draftFailed]=useModuleState('practice-profile-draft',practice.isExample,()=>({name:practice.profile.name,zone:practice.profile.timeZone}))
 const name=draft.name,zone=draft.zone,dirty=name!==practice.profile.name||zone!==practice.profile.timeZone
 const setName=(name:string)=>{setDraft(p=>({...p,name}));setProfileError('')},setZone=(zone:string)=>setDraft(p=>({...p,zone}))
 return <div className="ep-profile-settings"><SectionHeader title={tr("Настройки профиля", "Profile settings")}/>{notice&&<Notice>{notice}</Notice>}<SettingsCapabilities initialTab="profile" overview={<><div className="ex-settings-grid ep-profile-settings-grid"><section><h2>{tr("Профиль практики", "Practice profile")}</h2><form className="ex-editor ep-profile-settings-form" onSubmit={e=>{e.preventDefault();if(!name.trim()){setProfileError(tr("Укажите ваше имя.", "Enter your name."));return}onChange(p=>({...p,profile:{...p.profile,name:name.trim(),timeZone:zone}}));setDraft({name:name.trim(),zone});setProfileError('');setNotice(tr("Профиль сохранён. Новые записи отображаются в выбранном часовом поясе.", "Profile saved. New appointments use the selected time zone."))}}><label>{tr("Ваше имя", "Your name")}<input value={name} required onChange={e=>setName(e.target.value)}/></label><label>{tr("Часовой пояс", "Time zone")}<Select aria-label={tr("Часовой пояс", "Time zone")} value={zone} onChange={e=>setZone(e.target.value)}>{[...new Set([practice.profile.timeZone,'Europe/Moscow','Asia/Yekaterinburg','Asia/Novosibirsk','Europe/Berlin','UTC'])].map(z=><option key={z} value={z}>{timeZoneLabel(z)}</option>)}</Select></label><p className="ex-note">{tr("Часовой пояс расписания. Время уже созданных встреч останется прежним.", "The time zone for your schedule. Existing appointment times will not change.")}</p><p className="ex-note">{draftFailed?tr("Не удалось сохранить черновик.", "Could not save draft."):dirty?tr("Изменения сохранены как черновик. Примените их кнопкой ниже.", "Changes are saved as a draft. Apply them using the button below."):tr("Профиль сохранён.", "Profile saved.")}</p>{profileError&&<Notice error>{profileError}</Notice>}<div className="ex-actions"><button className="ep-button ep-button--primary">{tr("Сохранить профиль", "Save profile")}</button>{dirty&&<button type="button" className="ep-text-button" onClick={()=>{setDraft({name:practice.profile.name,zone:practice.profile.timeZone});setProfileError('')}}>{tr("Отменить изменения", "Discard changes")}</button>}</div></form></section><section><h2>{tr("Внешний вид", "Appearance")}</h2><div className="ep-profile-settings-fields"><LanguageControl/><label className="ep-profile-setting-field">{tr("Тема интерфейса", "Theme")}<Select aria-label={tr("Тема интерфейса", "Theme")} value={theme} onChange={e=>onThemeChange(e.target.value as 'dark'|'light')}><option value="dark">{tr("Ночная", "Dark")}</option><option value="light">{tr("Светлая", "Light")}</option></Select></label><p className="ex-note">{tr("Язык и тема применяются сразу.", "Language and theme changes apply immediately.")}</p></div></section></div><section className="ep-profile-settings-links" aria-labelledby="profile-client-pages"><h2 id="profile-client-pages">{tr("Страницы для клиентов", "Client-facing pages")}</h2><div><a href="#public-profile">{tr("Настроить личную страницу", "Set up public profile")}<Icon name="arrow"/></a><button onClick={()=>onClientPreview()}>{tr("Посмотреть кабинет клиента", "View client portal")}<Icon name="arrow"/></button></div></section></>} data={data} practice={practice} onOpenClient={onOpenClient}/></div>
}
