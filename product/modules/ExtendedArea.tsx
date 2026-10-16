import './section-directory.css'
import {LearningTip} from '../components/Learning'
import {useState,type Dispatch,type SetStateAction} from 'react'
import {ServicesFinance} from './ServicesFinance'
import {Communication} from './Communication'
import {Tools} from './Tools'
import {SectionHeader,useModuleState,Notice,type ModuleProps} from './ModuleKit'
import type {Practice} from '../state/model'
import {Icon} from '../components/Icon'
const groups = [
 {id:'consultations',title:'Для консультаций',items:[['tools','chart','Расчёты'],['journal','note','Заметки и итоги'],['library','library','Мои материалы']]},
 {id:'income',title:'Услуги и оплаты',items:[['services','service','Услуги и цены'],['finance','wallet','Оплаты'],['analytics','analytics','Аналитика']]},
 {id:'reminders',title:'Напоминания',items:[['astro-calendar','reminder','Личные задачи и даты'],['automations','flow','Автоматические напоминания']]},
 {id:'promotion',title:'Продвижение',items:[['content','publication','Публикации'],['reviews','star','Отзывы']]},
]
const items = [...groups.flatMap(group=>group.items), ['settings','settings','Настройки профиля']]

function SectionDirectory() {
 return <div className="ep-directory">
  <SectionHeader title="Все разделы"/>
  <div className="ep-directory-groups">
   {groups.map(group=><section className="ep-directory-group" key={group.id} aria-labelledby={`directory-${group.id}`}>
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
   <a className="ep-directory-link" href="#settings"><Icon name="settings" size={24}/><span>Настройки профиля</span><Icon name="arrow" size={18}/></a>
  </div>
 </div>
}

export const extendedSections=['practice','services','finance','analytics','messages','content','automations','reviews','tools','journal','astro-calendar','library','settings']
export function ExtendedArea({page,practice,onOpenClient,onChange,theme,onThemeChange,onClientPreview}:{page:string,onChange:Dispatch<SetStateAction<Practice>>,theme:string,onThemeChange:(theme:'dark'|'light')=>void,onClientPreview:()=>void}&ModuleProps){
 if(page==='practice')return <SectionDirectory/>
 const back=!['messages','tools'].includes(page)&&items.some(i=>i[0]===page)?'practice':''
 return <>{!['tools','journal'].includes(page)&&<LearningTip topic={page}/>} {back&&<a href={`#${back}`} className="ex-section-back"><Icon name="back" size={16}/>{back==='practice'?'Все разделы':'Все инструменты'}</a>}{['services','finance','analytics'].includes(page)?<ServicesFinance key={page} section={page as 'services'} practice={practice} onOpenClient={onOpenClient}/>:['messages','content','automations','reviews'].includes(page)?<Communication key={page} section={page as 'messages'} practice={practice} onOpenClient={onOpenClient}/>:['tools','journal','astro-calendar','library'].includes(page)?<Tools key={page} section={page as 'tools'} onChange={onChange} practice={practice} onOpenClient={onOpenClient}/>:<Settings practice={practice} onChange={onChange} theme={theme} onThemeChange={onThemeChange} onClientPreview={onClientPreview}/>}</>
}
function Settings({practice,onChange,theme,onThemeChange,onClientPreview}:{practice:Practice,onChange:Dispatch<SetStateAction<Practice>>,theme:string,onThemeChange:(value:'dark'|'light')=>void,onClientPreview:()=>void}){
 const [prefs,setPrefs]=useModuleState('settings',practice.isExample,()=>({appointments:true,messages:true,news:false}))
 const [notice,setNotice]=useState(''),[profileError,setProfileError]=useState('')
 const [draft,setDraft,draftFailed]=useModuleState('practice-profile-draft',practice.isExample,()=>({name:practice.profile.name,zone:practice.profile.timeZone}))
 const name=draft.name,zone=draft.zone,dirty=name!==practice.profile.name||zone!==practice.profile.timeZone
 const setName=(name:string)=>{setDraft(p=>({...p,name}));setProfileError('')},setZone=(zone:string)=>setDraft(p=>({...p,zone}))
 return <><SectionHeader title="Настройки профиля"/>{notice&&<Notice>{notice}</Notice>}<div className="ex-settings-grid"><section><h2>Профиль практики</h2><form className="ex-editor" onSubmit={e=>{e.preventDefault();if(!name.trim()){setProfileError('Укажите ваше имя.');return}onChange(p=>({...p,profile:{name:name.trim(),timeZone:zone}}));setDraft({name:name.trim(),zone});setProfileError('');setNotice('Профиль сохранён. Новые записи отображаются в выбранном часовом поясе.')}}><label>Ваше имя<input value={name} required onChange={e=>setName(e.target.value)}/></label><label>Часовой пояс<select value={zone} onChange={e=>setZone(e.target.value)}>{[...new Set([practice.profile.timeZone,'Europe/Moscow','Asia/Yekaterinburg','Asia/Novosibirsk','Europe/Berlin','UTC'])].map(z=><option key={z}>{z}</option>)}</select></label><p className="ex-note">Часовой пояс расписания. Время уже созданных встреч останется прежним.</p><p className="ex-note">{draftFailed?'Не удалось сохранить черновик.':dirty?'Изменения сохранены как черновик. Примените их кнопкой ниже.':'Профиль сохранён.'}</p>{profileError&&<Notice error>{profileError}</Notice>}<div className="ex-actions"><button className="ep-button ep-button--primary">Сохранить профиль</button>{dirty&&<button type="button" className="ep-text-button" onClick={()=>{setDraft({name:practice.profile.name,zone:practice.profile.timeZone});setProfileError('')}}>Отменить изменения</button>}</div></form></section><section><h2>Внешний вид</h2><label className="ex-setting-row">Тема интерфейса<select value={theme} onChange={e=>onThemeChange(e.target.value as 'dark'|'light')}><option value="dark">Ночная</option><option value="light">Светлая</option></select></label><div className="ex-actions"><button className="ep-button" onClick={onClientPreview}>Посмотреть кабинет клиента <Icon name="arrow"/></button></div></section><section><h2>Уведомления</h2>{[['appointments','О новых записях'],['messages','О сообщениях клиентов'],['news','Новости сервиса']].map(([key,label])=><label className="ex-setting-row" key={key}>{label}<input type="checkbox" checked={prefs[key as keyof typeof prefs]} onChange={e=>setPrefs(p=>({...p,[key]:e.target.checked}))}/></label>)}</section><section><h2>Тариф и оплата</h2><p className="ex-note">Вам доступны все разделы для управления практикой.</p><dl className="ex-detail"><div><dt>Списания</dt><dd>Отсутствуют</dd></div><div><dt>Комиссия сервиса</dt><dd>4%</dd></div></dl><a className="ep-button" href="#finance">История операций <Icon name="arrow"/></a></section></div></>
}
