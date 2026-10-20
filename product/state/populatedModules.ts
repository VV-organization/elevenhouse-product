/** Fictional local account fixtures. No integration or outbound action is executed. */
import {createMemberPractice,memberPayments,memberServices} from './memberCore'
import {memberWorkspaceModules} from './memberModules'
import {commerceDefaults,type MoneyDraft} from './commerce-model'
import {flowDefaults,type Flow,type ReviewRecord,type Publication} from './communication-workflows'
import {newPublicProfile,type PublicProfileState} from './public-profile'
import {numerology,matrix,matrixYear} from './calculationMethods'
import type {PortalOrder} from '../modules/portal-order-model'
import type {ClientCase} from '../modules/portal-case-model'
import type {Payment} from '../modules/ServicesFinance'
import type {WalletSnapshot,LedgerRow} from '../modules/commerce-ledger-model'
import type {AnalyticsEvidence} from '../modules/commerce-analytics-model'
import type {Brief} from './today-workbench'

const practice=createMemberPractice()
const at='2026-10-15T09:00:00.000Z'
const service=(id:string)=>memberServices.find(s=>s.id===id)!
const orderRows:Array<[string,string,PortalOrder['status']]>=[
 ['kira','solar','requested'],['polina','natal','requested'],['denis','support-pack','requested'],
 ['sofia','intro','requested'],['olga','monthly','accepted'],['marina','support-pack','accepted'],
 ['irina','monthly','accepted'],['roman','question','cancellation-requested'],['victor','career','rejected'],['andrey','followup','cancelled'],['marina','monthly','accepted'],
]
const orders:PortalOrder[]=orderRows.map(([clientId,serviceId,status],index)=>{
 const s=service(serviceId),c=practice.clients.find(c=>c.id===clientId)!
 return {id:`filled-order-${index+1}`,clientId,serviceId,title:s.name,description:s.description,includes:[...s.includes],commerce:structuredClone(s.commerce??commerceDefaults(s.price)),basePrice:s.price,total:s.price,duration:s.duration,selectedExtras:[],answers:{name:c.name,contact:c.email!,question:c.request},createdAt:`2026-10-${String(15-Math.floor(index/2)).padStart(2,'0')}T08:30:00.000Z`,status,
  ...(status==='accepted'?{preparation:index===5?'in-progress' as const:'ready' as const,decisionNote:'Условия согласованы в переписке. Материалы подготовлены в кабинете.'}:{}),
  ...(status==='rejected'?{decisionNote:'Выбранный формат не соответствует запросу. Предложена индивидуальная встреча.'}:{}),
 }
})
const orderPayments:Payment[]=orders.filter(o=>o.status==='accepted').map((o,index)=>({id:`EH-FILLED-${index+1}`,orderId:o.id,clientId:o.clientId!,serviceId:o.serviceId,serviceName:o.title,date:o.createdAt.slice(0,10),amount:o.total,commission:Math.round(o.total*.04),status:'paid',kind:o.commerce.sale==='subscription'?'subscription':'order'}))
const payments=[...orderPayments,...memberPayments]
const refundable=memberPayments.find(p=>p.status==='paid'&&p.appointmentId==='session-upcoming-1')??memberPayments.find(p=>p.status==='paid')!
const drafts:MoneyDraft[]=[
 {id:'filled-payout-1',kind:'payout',amount:24000,destination:'Анна Соколова · •••• 4242',reason:'Вывод части поступлений за октябрь',createdAt:'2026-10-15T08:20:00.000Z',status:'prepared',payoutMethod:{type:'card',recipient:'Анна Соколова',cardLast4:'4242'}},
 {id:'filled-payout-2',kind:'payout',amount:12000,destination:'Анна Соколова · •••• 4242',reason:'Черновик заменён заявкой на другую сумму',createdAt:'2026-10-12T09:00:00.000Z',status:'cancelled',payoutMethod:{type:'card',recipient:'Анна Соколова',cardLast4:'4242'}},
 {id:'filled-refund-1',kind:'refund',paymentId:refundable.id,amount:Math.round(refundable.amount/2),destination:'',reason:'Согласован частичный возврат при изменении объёма консультации.',createdAt:'2026-10-14T17:00:00.000Z',status:'prepared'},
]
const cases:ClientCase[]=[
 {id:'filled-case-1',clientId:refundable.clientId,paymentId:refundable.id,title:refundable.serviceName,kind:'refund',reason:'other',description:'Планы изменились. Хотелось бы сократить встречу и вернуть часть оплаты по согласованным условиям.',amount:Math.round(refundable.amount/2),createdAt:'2026-10-14T16:00:00.000Z',status:'reviewing',response:'Уточним новый объём встречи. Черновик частичного возврата подготовлен.'},
 {id:'filled-case-2',clientId:'olga',orderId:'filled-order-5',title:'Клуб наблюдений на месяц',kind:'dispute',reason:'other',description:'Не нашла материал о подведении итогов. Подскажите, в каком разделе его открыть.',createdAt:'2026-10-15T08:00:00.000Z',status:'prepared'},
 {id:'filled-case-3',clientId:'marina',orderId:'filled-order-6',title:'Три встречи для нового этапа',kind:'dispute',reason:'other',description:'Хотела уточнить, как согласовать дату второй встречи пакета.',createdAt:'2026-10-11T12:00:00.000Z',status:'resolved',response:'Даты следующих встреч согласуем после первой консультации в переписке.'},
]
const flows:Flow[]=(memberWorkspaceModules.automations as Flow[]).map(flowDefaults)
flows.push(flowDefaults({id:'filled-flow-review',name:'Обратная связь после встречи',kind:'after',status:'paused',text:'{имя}, что оказалось самым полезным на встрече? Если хотите, оставьте отзыв в кабинете.'}))
flows.push({id:'filled-flow-intake',name:'От заявки к подготовке встречи',kind:'data',trigger:'booking',triggerParams:{service:''},status:'ready',text:'Проверка данных и подготовка к новой встрече',steps:[
 {id:'intake-data',kind:'condition',value:'birth-complete',branches:{yes:'intake-task',no:'intake-message'}},
 {id:'intake-message',kind:'message',value:'{имя}, пожалуйста, проверьте дату, место и время рождения в карточке.',channel:'portal',next:'intake-review'},
 {id:'intake-review',kind:'approval',value:'Проверить запрос перед отправкой',next:'intake-deliver'},
 {id:'intake-deliver',kind:'deliver',value:'',channel:'portal',next:null},
 {id:'intake-task',kind:'task',value:'Прочитать запрос и заметки клиента перед консультацией',next:null},
]})
const reviews:ReviewRecord[]=(memberWorkspaceModules.reviews as ReviewRecord[]).map((r,index)=>({...r,rating:index===4?4:5,status:index===1?'pending':'published',date:`2026-10-${String(14-index).padStart(2,'0')}`,appointmentId:practice.appointments.find(a=>a.clientId===r.clientId&&a.status==='completed')?.id}))
reviews.push({id:'filled-review-pavel',clientId:'pavel',text:'Удалось спокойно разделить задачи с партнёром. Письменное резюме помогло вернуться к договорённостям через неделю.',response:'',rating:5,status:'pending',date:'2026-10-15'})
const conversations=structuredClone(memberWorkspaceModules.conversations) as {threads:Record<string,unknown[]>;drafts:Record<string,string>}
for(const c of practice.clients){if(!conversations.threads[c.id])conversations.threads[c.id]=[
 {id:`filled-message-${c.id}-1`,from:'client',text:`Здравствуйте, Анна! Хочу обсудить: ${c.request.toLocaleLowerCase()}.`,time:'14 октября · 09:20',sentAt:'2026-10-14T09:20:00'},
 {id:`filled-message-${c.id}-2`,from:'you',text:'Здравствуйте! Записала ваш запрос. Какие два вопроса для вас сейчас самые важные?',time:'14 октября · 10:05',sentAt:'2026-10-14T10:05:00'},
 {id:`filled-message-${c.id}-3`,from:'client',text:c.notes.split('\n')[0],time:'15 октября · 08:40',sentAt:'2026-10-15T08:40:00'},
]}
const briefs:Record<string,Brief>=Object.fromEntries(practice.appointments.filter(a=>a.status==='confirmed').slice(0,8).map(a=>{
 const c=practice.clients.find(c=>c.id===a.clientId)!
 return [a.id,{id:`filled-brief-${a.id}`,appointmentId:a.id,clientId:c.id,source:'Рабочие заметки специалиста · пример',generatedAt:at,text:`Запрос: ${c.request}.\n\nПеред встречей: перечитать предыдущий итог и уточнить, что изменилось.\n\nПлан разговора:\n1. Выбрать главный вопрос на сегодня.\n2. Обсудить наблюдения и конкретные ситуации.\n3. Согласовать один следующий шаг и дату возвращения к нему.\n\n${c.unknownTime?'Время рождения неизвестно; обозначить ограничения разбора.':'Проверить исходные данные рождения с клиентом.'}`}]
}))
const profile:PublicProfileState=newPublicProfile('Анна Соколова')
Object.assign(profile.draft,{slug:'anna-sokolova',tagline:'Индивидуальные консультации и сопровождение',bio:'Помогаю осмыслить профессиональные и личные перемены. Начинаем с вашего конкретного запроса, связываем разбор с реальными обстоятельствами и сохраняем понятные итоги встречи. Работаю с темами выбора направления, ритма жизни и перехода к новому этапу.',experience:'7',specializations:['Профессиональный выбор','Личные приоритеты','Сопровождение'],methods:['Натальная астрология','Соляр'],languages:['Русский'],blocks:[{id:'filled-faq',kind:'faq',title:'Нужно ли знать точное время рождения?',text:'Если время неизвестно, отметьте это при записи. Мы согласуем формат и заранее обсудим ограничения разбора.',visible:true},{id:'filled-steps',kind:'steps',title:'Как проходит работа',text:'Выберите услугу и оставьте запрос. Согласуем время, проведём встречу и сохраним письменное резюме в кабинете.',visible:true}]})
const evidence:AnalyticsEvidence={events:[],cohorts:[],coverage:{from:'2026-08-01',to:'2026-10-15'}}
for(const [index,p] of payments.filter(p=>p.status==='paid').entries())for(const [step,kind] of (['visit','lead','booking','paid'] as const).entries()) evidence.events.push({id:`filled-analytics-${p.id}-${kind}`,visitorId:`visitor-${p.id}`,at:`${p.date}T${String(8+step).padStart(2,'0')}:00:00.000Z`,source:['Личная страница','Рекомендации','Повторное обращение'][index%3],kind,clientId:p.clientId,...(kind==='paid'?{paymentId:p.id}:{})})
for(let i=0;i<24;i++)for(const [step,kind] of (i<6?['visit','lead','booking'] as const:i<12?['visit','lead'] as const:['visit'] as const).entries())evidence.events.push({id:`filled-visit-${i}-${kind}`,visitorId:`visitor-unconverted-${i}`,at:`2026-10-13T${String(9+step).padStart(2,'0')}:00:00.000Z`,source:'Личная страница',kind})
const calculations=Object.fromEntries(practice.clients.slice(0,8).flatMap(c=>[
 [`${c.id}:numbers:portrait:2026:`,{at,result:{name:c.name,date:c.birthDate,year:2026,...numerology(c.birthDate,c.name,2026)}}],
 [`${c.id}:matrix:portrait:2026:`,{at,result:{name:c.name,date:c.birthDate,year:2026,...matrix(c.birthDate),cycle:matrixYear(c.birthDate,2026,'2026-10-15')}}],
]))
const settlementPending=orderPayments.reduce((sum,p)=>sum+p.amount-p.commission,0)
const wallet:WalletSnapshot & {example:true}={available:payments.filter(p=>p.status==='paid').reduce((sum,p)=>sum+p.amount-p.commission,0)-32000-settlementPending-4900,pending:settlementPending,held:4900,feePercent:1,updatedAt:at,example:true}
const ledger:LedgerRow[]=[{id:'filled-settled-payout',type:'payout',date:'2026-10-09',amount:-32000,status:'paid',title:'Выплата на карту •••• 4242',details:'Пример завершённой выплаты в истории аккаунта',actual:true}]
const content:Publication[]=[...(memberWorkspaceModules.content as Publication[]),
 {id:'filled-post-6',title:'Вопросы к личному году',text:'Что хочется сохранить из прошлого года? Какой небольшой шаг поможет освободить время для собственного проекта? Какие обязательства можно пересмотреть?',date:'2026-10-28',time:'10:00',zone:'Europe/Moscow',status:'draft',audience:'sub',channels:['portal'],type:'post'},
 {id:'filled-post-7',title:'Открытая встреча: как сформулировать запрос',text:'Обсудим, как выделить один главный вопрос и подготовиться к индивидуальной консультации. Собрать вопросы участников и согласовать время.',date:'2026-10-29',time:'19:00',zone:'Europe/Moscow',status:'draft',type:'live',audience:'public',channels:['portal']},
]
export const populatedModules:Record<string,unknown>={...memberWorkspaceModules,services:memberServices,payments,conversations,content,automations:flows,reviews,
 'notification-read':[...practice.appointments.map(a=>`meeting-${a.id}-${a.date}-${a.time}-${a.status}`),...payments.slice(3).map(p=>`payment-${p.id}-${p.status}`),...orders.filter(o=>!['requested','cancellation-requested'].includes(o.status)).map(o=>`order-${o.id}-${o.status}`),...Object.entries(calculations).slice(2).map(([key])=>`calculation-${key}-${at}`)],
 'client-orders':orders,'client-cases':cases,'money-requests':drafts,'wallet-snapshot':wallet,'financial-ledger':ledger,
 'client-family':[{id:'filled-family-1',name:'Александр Иванов',relation:'Партнёр',birthDate:'1989-05-12',birthTime:'10:30',birthPlace:'Москва',unknownTime:false}],
 'appointment-briefs':briefs,'saved-method-calculations':calculations,'public-profile':profile,
 'analytics-evidence':evidence,'analytics-goals':[{id:'filled-goal-october',period:'month',start:'2026-10-01',target:150000}],
}
