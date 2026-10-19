import {Icon} from '../components/Icon'
import {tr} from '../i18n'
import type {Practice} from '../state/model'
import type {Flow} from '../state/communication-workflows'
import {DEFAULT_SERVICES,type Service} from './ServicesFinance'
import type {PortalOrder} from './portal-order-model'
import {serviceSummary} from './commerce-copy'
import {Notice,SectionHeader,useModuleState} from './ModuleKit'
import './business-workspace.css'

type Entry={id:string;icon:string;ru:string;en:string;color:string}
const catalog: {ru:string;en:string;entries:Entry[]}[]=[
 {ru:'Обзор и работа',en:'Overview and work',entries:[
  {id:'dashboard',icon:'analytics',ru:'Обзор практики',en:'Practice overview',color:'gold'},
  {id:'today',icon:'today',ru:'Сегодня · рабочий день',en:'Today · working day',color:'sage'},
  {id:'analytics',icon:'chart',ru:'Аналитика',en:'Analytics',color:'plum'},
  {id:'finance',icon:'wallet',ru:'Финансы',en:'Finance',color:'copper'},
 ]},
 {ru:'Продажи и продвижение',en:'Sales and promotion',entries:[
  {id:'services',icon:'service',ru:'Продукты и услуги',en:'Products and services',color:'gold'},
  {id:'automations',icon:'flow',ru:'Воронки и автоматизация',en:'Funnels and automation',color:'sage'},
  {id:'content',icon:'publication',ru:'Контент',en:'Content',color:'terra'},
  {id:'public-profile',icon:'profile',ru:'Личная страница',en:'Public profile',color:'plum'},
 ]},
 {ru:'Репутация и настройки',en:'Reputation and settings',entries:[
  {id:'reviews',icon:'star',ru:'Отзывы',en:'Reviews',color:'copper'},
  {id:'settings',icon:'settings',ru:'Настройки профиля',en:'Profile settings',color:'plum'},
  {id:'plans',icon:'lock',ru:'Тарифы · Старт, Pro, Studio',en:'Plans · Start, Pro, Studio',color:'gold'},
 ]},
]

function businessHref(params:Record<string,string>){const url=new URL(window.location.href);url.hash='services';url.searchParams.delete('requests');url.searchParams.delete('service');Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value));return url.toString()}

export function BusinessWorkspace({practice}:{practice:Practice}){
 const [services,,servicesFailed]=useModuleState<Service[]>('services',practice.isExample,()=>practice.isExample?DEFAULT_SERVICES:[])
 const [flows,,flowsFailed]=useModuleState<Flow[]>('automations',practice.isExample,()=>[])
 const [orders,,ordersFailed]=useModuleState<PortalOrder[]>('client-orders',practice.isExample,()=>[])
 const available=services.filter(s=>s.status==='available'&&!s.archived)
 const waiting=orders.filter(order=>order.status==='requested'||order.status==='cancellation-requested')
 const ready=flows.filter(flow=>flow.status==='ready')
 return <div className="ep-business">
  <SectionHeader title={tr('Моя практика','My practice')} action={<a className="ep-button" href="#public-profile"><Icon name="profile" size={18}/>{tr('Личная страница','Public profile')}</a>}/>
  {(servicesFailed||flowsFailed||ordersFailed)&&<Notice error>{tr('Не удалось сохранить данные на этом устройстве. Проверьте доступ к хранилищу браузера.','Could not save data on this device. Check browser storage access.')}</Notice>}
  <section className="ep-business-current" aria-labelledby="business-current-title">
   <div className="ep-business-section-heading"><h2 id="business-current-title">{tr('В работе','In progress')}</h2></div>
   <div className="ep-business-current-grid">
    <div className="ep-business-services">
     <div className="ep-business-subheading"><h3>{tr('Доступные услуги','Available services')} <span>{available.length}</span></h3><a href="#services">{tr('Каталог услуг','Service catalog')} <Icon name="arrow" size={16}/></a></div>
     {available.length?<div className="ep-business-service-grid">{available.slice(0,3).map((service,index)=><article key={service.id} className="ep-business-service" data-tone={['gold','sage','terra'][index]}>
      <span className="ep-business-symbol"><Icon name="service" size={27}/></span>
      <h3>{service.name}</h3><p>{service.description}</p>
      <div className="ep-business-price"><strong>{serviceSummary(service)}</strong></div>
      <a href={businessHref({service:service.id})} className="ep-business-service-link">{tr('Открыть услугу','Open service')}<Icon name="arrow" size={17}/></a>
     </article>)}</div>:<div className="ep-business-empty"><Icon name="service" size={30}/><h3>{tr('Пока нет доступных услуг','No available services yet')}</h3><p>{tr('Создайте услугу или опубликуйте сохранённый черновик в каталоге.','Create a service or publish a saved draft in the catalog.')}</p><a className="ep-button" href="#services">{tr('Открыть каталог услуг','Open service catalog')}</a></div>}
     {available.length>3&&<a className="ep-business-more" href="#services">{tr('Все доступные услуги','All available services')} · {available.length}<Icon name="arrow" size={17}/></a>}
    </div>
    <aside className="ep-business-activity" aria-label={tr('Сценарии и заявки','Workflows and requests')}>
     <section className="ep-business-flows"><div className="ep-business-subheading"><h3>{tr('Сценарии','Workflows')}</h3><span className="ep-business-count">{flows.length}</span></div>
      {flows.length?<><p className="ep-business-flow-summary">{tr('Готовы к запуску','Ready to run')} <strong>{ready.length}</strong><span> · {tr('На паузе','Paused')} {flows.length-ready.length}</span></p><ul>{flows.slice(0,2).map(flow=><li key={flow.id}><span className="ep-business-flow-dot" data-ready={flow.status==='ready'}/><span>{flow.name}<small>{flow.status==='ready'?tr('Готов к запуску','Ready to run'):tr('На паузе','Paused')}</small></span></li>)}</ul></>:<p className="ep-business-secondary">{tr('Сохранённых сценариев пока нет.','No saved workflows yet.')}</p>}
      <a className="ep-business-inline-link" href="#automations">{flows.length?tr('Все сценарии','All workflows'):tr('Создать сценарий','Create a workflow')}<Icon name="arrow" size={17}/></a>
     </section>
     <a className="ep-business-orders" href={businessHref({requests:'all'})}><span className="ep-business-symbol" data-tone="copper"><Icon name="message" size={25}/></span><span><strong>{waiting.length}</strong><span>{tr('Заявки требуют решения','Requests awaiting a decision')}</span><small>{tr('Открыть в продуктах и услугах','Open in products and services')}</small></span><Icon name="arrow" size={18}/></a>
    </aside>
   </div>
  </section>
  <section className="ep-business-catalog" aria-labelledby="business-catalog-title"><div className="ep-business-section-heading"><h2 id="business-catalog-title">{tr('Разделы практики','Practice sections')}</h2><a href="#practice">{tr('Все разделы','All sections')}<Icon name="arrow" size={17}/></a></div>
   <div className="ep-business-categories">{catalog.map((group,index)=><section className="ep-business-category" key={group.en} aria-labelledby={`business-category-${index}`}><h3 id={`business-category-${index}`}>{tr(group.ru,group.en)}</h3><div className="ep-business-entry-grid">{group.entries.map(entry=><a key={entry.id} className="ep-business-entry" href={`#${entry.id}`} data-tone={entry.color}><span className="ep-business-symbol"><Icon name={entry.icon} size={26}/></span><span>{tr(entry.ru,entry.en)}</span><Icon name="arrow" size={16}/></a>)}</div></section>)}</div>
  </section>
 </div>
}
