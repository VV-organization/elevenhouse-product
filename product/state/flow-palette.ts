import {tr} from '../i18n'
import {aiDefaults} from './communication-ai'
import type {FlowStep} from './communication-workflows'
export type FlowChoice=[string,string,string]
export type FlowField={key:string;label:[string,string];type?:'textarea'|'number';options?:FlowChoice[];required?:boolean;initial?:string|number}
export type FlowCalculation={type:string;houses:string;ayan:string;date:string;returnKind:string;partner:string;moment:string;cities:string;outputs:string[];dest:string[]}
// app/flow-data.jsx PALETTE and app/flow-engine.jsx CALC_TYPES / defaults.
export const flowTriggerChoices:FlowChoice[]=[['manual','Вручную','Manually'],['before','До встречи','Before appointment'],['completed','Встреча завершена','Appointment completed'],['missing-data','Не хватает данных рождения','Missing birth details'],['new_client','Добавлен клиент','Client added'],['payment','Получена оплата','Payment received'],['subscription','Началась подписка','Subscription started'],['birthday','День рождения','Birthday'],['lead','Новый лид со страницы','New lead from profile'],['purchase','Куплен продукт','Product purchased'],['msg_in','Сообщение клиента','Incoming message'],['transit','Астрособытие','Astrological event'],['segment','Смена сегмента','Segment changed'],['form_done','Заполнена форма','Form completed'],['booking','Запись подтверждена','Booking confirmed'],['schedule','Дата / расписание','Date / schedule'],['review','Получен отзыв','Review received'],['sub_renew','Подписка: продление / отток','Subscription renewal / churn'],['chart_ready','Карта рассчитана','Chart calculated'],['journal_entry','Запись в дневнике','Journal entry']]
export const calculationChoices:FlowChoice[]=[['natal','Натальная карта','Natal chart'],['transits','Транзиты','Transits'],['progress','Прогрессии','Progressions'],['directions','Дирекции','Directions'],['return','Возвращения','Returns'],['synastry','Синастрия','Synastry'],['composite','Композит','Composite'],['horary','Хорар','Horary'],['acg','Астрокартография','Astrocartography'],['vedic','Ведическая','Vedic'],['child','Детская карта','Child chart'],['numerology','Нумерология','Numerology'],['matrix','Матрица судьбы','Destiny Matrix'],['humandesign','Дизайн человека','Human Design']]
export const flowOutputChoices:FlowChoice[]=[['planets','Положения планет','Planet positions'],['aspects','Аспекты','Aspects'],['houses','Дома','Houses'],['wheel','Колесо','Wheel'],['tables','Таблицы','Tables'],['acgmap','Карта мест','Location map']]
export const flowDestinationChoices:FlowChoice[]=[['client','Клиенту в материалы','Client materials'],['brief','В бриф астрологу','Practitioner brief'],['ai','На вход AI','AI input']]
export const houseChoices:FlowChoice[]=[['placidus','Плацидус','Placidus'],['koch','Кох','Koch'],['whole','Цельнознаковая','Whole sign'],['regiomontanus','Региомонтан','Regiomontanus'],['campanus','Кампанус','Campanus']]
export const ayanChoices:FlowChoice[]=[['lahiri','Лахири','Lahiri'],['raman','Раман','Raman'],['kp','КП (Кришнамурти)','KP (Krishnamurti)'],['fagan','Фаган-Брэдли','Fagan-Bradley']]
export const partnerChoices:FlowChoice[]=[['order','Из заказа (2-я анкета)','Order (second form)'],['profile','Из профиля клиента','Client profile'],['request','Запросить отдельно','Request separately']]
export function flowCalculationDefaults(type='natal'):FlowCalculation{return {type,houses:'placidus',ayan:'lahiri',date:tr('На сегодня','Today'),returnKind:'solar',partner:'order',moment:tr('Время обращения клиента','Client request time'),cities:'',outputs:['planets','aspects','houses','wheel'],dest:['client','ai']}}
const field=(key:string,ru:string,en:string,type?:FlowField['type'],initial?:string|number):FlowField=>({key,label:[ru,en],required:true,type,initial})
const optional=(key:string,ru:string,en:string):FlowField=>({key,label:[ru,en]})
const choice=(key:string,ru:string,en:string,options:FlowChoice[]):FlowField=>({key,label:[ru,en],required:true,options,initial:options[0][0]})
export function triggerFields(trigger:string):FlowField[]{
 if(['purchase','payment','subscription','sub_renew'].includes(trigger))return [field('product','Продукт / услуга','Product / service'),...(trigger==='sub_renew'?[choice('event','Событие подписки','Subscription event',[['renew','Продление','Renewal'],['churn','Отток','Churn'],['either','Любое','Either']])]:[])]
 if(trigger==='transit')return [field('event','Астрособытие / правило','Astrological event / rule')]
 if(trigger==='segment')return [field('segment','Новый сегмент','New segment')]
 if(trigger==='form_done')return [field('form','Форма / анкета','Form / questionnaire')]
 if(trigger==='msg_in')return [optional('channel','Канал · пусто означает любой','Channel · empty means any')]
 if(trigger==='review')return [choice('rating','Оценки','Ratings',[['any','Любая оценка','Any rating'],['positive','4–5','4–5'],['negative','1–3','1–3']])]
 if(trigger==='chart_ready')return [choice('calculation','Тип расчёта','Calculation type',calculationChoices)]
 if(trigger==='journal_entry')return [optional('journal','Дневник / программа','Journal / program')]
 if(trigger==='booking')return [optional('service','Услуга · пусто означает любую','Service · empty means any')]
 if(trigger==='lead')return [optional('page','Страница / форма','Profile / form')]
 return []
}
export type PaletteItem={id:string;group:[string,string];label:[string,string];kind:FlowStep['kind'];value?:string;task?:string;calculation?:string}
const item=(id:string,ru:string,en:string,kind:FlowStep['kind'],group:[string,string]=['Действия','Actions'],rest:Partial<PaletteItem>={}):PaletteItem=>({id,label:[ru,en],kind,group,...rest})
export const flowPalette:PaletteItem[]=[
 item('send','Подготовить сообщение','Prepare message','message'),item('form','Запросить данные','Request data','task'),item('slot','Предложить слот','Offer a time slot','task'),item('pay','Запросить оплату','Request payment','task'),item('deliver','Доставить результат','Deliver result','deliver'),item('access','Открыть доступ','Grant access','task'),item('cert','Выдать сертификат','Issue certificate','task'),item('tag','Тег / сегмент','Tag / segment','task'),item('task','Создать задачу','Create task','task'),item('webhook','Webhook / интеграция','Webhook / integration','task'),
 ...[['chart','Рассчитать карту','Calculate chart','natal'],['acg','Астрокартография','Astrocartography','acg'],['numerology','Нумерология','Numerology','numerology'],['matrix','Матрица судьбы','Destiny Matrix','matrix'],['humandesign','Дизайн человека','Human Design','humandesign']].map(([id,ru,en,calculation])=>item(id,ru,en,'calculate',['Движок карт','Chart engine'],{calculation})),
 item('publish','Опубликовать пост','Publish post','task',['Контент','Content']),item('sub_post','Пост подписчикам','Subscriber post','task',['Контент','Content']),item('broadcast','Рассылка по сегменту','Segment broadcast','task',['Контент','Content']),
 ...[['analyze','Разбор / генерация','Analysis / generation'],['classify','Классификация','Classification'],['summary','Резюме сессии','Session summary'],['score','Скоринг лида','Lead scoring'],['extract','Извлечь данные','Extract data'],['reply','AI-ответ клиенту','AI client reply'],['content','Черновик контента','Content draft']].map(([task,ru,en])=>item('ai_'+task,ru,en,'ai',['AI','AI'],{task})),
 item('if','Условие if/else','If/else condition','condition',['Логика','Logic'],{value:'birth-complete'}),item('chart_cond','По данным карты','Chart condition','condition',['Логика','Logic'],{value:'chart-condition'}),item('split','Маршрут по значению','Route by value','condition',['Логика','Logic'],{value:'value-match'}),item('ab','A/B-разделение','A/B split','condition',['Логика','Logic'],{value:'ab'}),item('delay','Пауза / ожидание','Pause / wait','delay',['Логика','Logic']),item('handoff','Передать астрологу','Hand off to practitioner','approval',['Человек','Human']),item('session','Живая видеосессия','Live video session','task',['Человек','Human'])
]
export function actionFields(action:string):FlowField[]{
 if(action==='form')return [field('fields','Поля формы','Form fields','textarea',tr('Дата, время, место рождения и запрос','Birth date, time, place and request')),field('destination','Куда отправить форму','Form destination')]
 if(action==='slot')return [field('service','Услуга','Service'),field('availability','Период / доступные слоты','Period / available slots')]
 if(action==='pay')return [field('product','Услуга / заказ','Service / order'),field('amount','Сумма, ₽','Amount, RUB','number'),optional('url','Ссылка на оплату','Payment URL')]
 if(['access','cert'].includes(action))return [field('resource',action==='access'?'Контент / канал / курс':'Шаблон сертификата',action==='access'?'Content / channel / course':'Certificate template'),optional('duration','Срок действия','Validity period')]
 if(action==='tag')return [choice('operation','Действие','Operation',[['add','Добавить тег','Add tag'],['remove','Убрать тег','Remove tag'],['segment','Изменить сегмент','Change segment']]),field('value','Тег / сегмент','Tag / segment')]
 if(action==='webhook')return [field('url','HTTPS URL','HTTPS URL'),choice('method','Метод','Method',[['POST','POST','POST'],['PUT','PUT','PUT'],['PATCH','PATCH','PATCH']]),field('payload','Тело запроса JSON','JSON request body','textarea','{}')]
 if(['publish','sub_post','broadcast'].includes(action))return [field('destination',action==='broadcast'?'Сегмент аудитории':'Страница / канал',action==='broadcast'?'Audience segment':'Profile / channel'),choice('format','Формат','Format',[['post','Текст','Text'],['video','Видео','Video'],['audio','Аудио','Audio']]),field('text','Текст / источник результата','Text / result source','textarea')]
 if(action==='deliver')return [choice('format','Формат','Format',[['video-pdf','Видео + PDF','Video + PDF'],['audio','Аудио','Audio'],['text','Текст','Text']]),field('destination','Куда доставить','Destination','textarea',tr('Материалы заказа','Order materials'))]
 if(action==='session')return [field('assignee','Кто проводит','Host','textarea',tr('Астролог','Practitioner')),field('service','Услуга / встреча','Service / appointment')]
 if(action==='handoff')return [field('assignee','Кому передать','Assignee','textarea',tr('Астролог','Practitioner')),optional('note','Задание для специалиста','Task for practitioner')]
 if(action==='task')return [field('assignee','Исполнитель','Assignee','textarea',tr('Я','Me')),field('text','Что сделать','Task','textarea'),optional('deadline','Срок','Deadline')]
 if(action==='chart_cond')return [field('rule','Правило по карте','Chart rule','textarea')]
 if(action==='split')return [choice('field','Поле','Field',[['segment','Сегмент','Segment'],['tag','Тег','Tag'],['topic','Тема','Topic'],['custom','Другое поле','Other field']]),field('equals','Ожидаемое значение','Expected value')]
 if(action==='ab')return [field('percent','Доля ветки A, %','Branch A share, %','number',50)]
 if(action==='delay')return [choice('mode','Ожидать','Wait for',[['time','Промежуток времени','Time period'],['event','Событие','Event']]),optional('event','Какое событие','Which event')]
 return []
}
export function fieldDefaults(fields:FlowField[]){return Object.fromEntries(fields.map(f=>[f.key,f.initial??'']))}
export function newPaletteStep(id:string,stepId:string):FlowStep{const p=flowPalette.find(i=>i.id===id);if(!p)throw new Error('Unknown flow palette entry');return {id:stepId,kind:p.kind,action:id,value:p.value??'',params:fieldDefaults(actionFields(id)),...(p.calculation?{calculation:flowCalculationDefaults(p.calculation)}:{}),...(p.task?{ai:aiDefaults('',p.task)}:{}),...(p.kind==='delay'?{amount:1,unit:'days' as const}:{}),...(['message','deliver'].includes(p.kind)?{channel:'portal' as const}:{})}}
export const outboundActions=['pay','access','cert','webhook','publish','sub_post','broadcast','deliver']
export function flowConfigurationError(step:FlowStep):string{
 if(!step.action&&!step.calculation)return ''
 const values=step.params||{},fields=actionFields(step.action||'')
 if(fields.some(f=>f.required&&!String(values[f.key]??'').trim()||f.options&&!f.options.some(o=>o[0]===values[f.key])))return 'configuration'
 if(step.action==='ab'&&(!Number.isFinite(Number(values.percent))||Number(values.percent)<0||Number(values.percent)>100))return 'configuration'
 if(step.action==='pay'&&(!Number.isFinite(Number(values.amount))||Number(values.amount)<=0))return 'configuration'
 if(step.action==='delay'&&values.mode==='event'&&!String(values.event||'').trim())return 'configuration'
 if(step.action==='webhook'){try{const url=new URL(String(values.url));if(url.protocol!=='https:'||url.username||url.password)return 'configuration';JSON.parse(String(values.payload))}catch{return 'configuration'}}
 const c=step.calculation;if(c){if(!houseChoices.some(o=>o[0]===c.houses)||!ayanChoices.some(o=>o[0]===c.ayan)||!partnerChoices.some(o=>o[0]===c.partner)||!['solar','lunar'].includes(c.returnKind))return 'configuration';if(!calculationChoices.some(x=>x[0]===c.type)||!c.dest.length||c.dest.some(x=>!flowDestinationChoices.some(d=>d[0]===x)))return 'configuration';if(!['numerology','matrix','humandesign'].includes(c.type)&&(!c.outputs.length||c.outputs.some(x=>!flowOutputChoices.some(d=>d[0]===x))))return 'configuration';if(c.type==='acg'&&!c.cities.trim()||['transits','progress','directions','return'].includes(c.type)&&!c.date.trim()||c.type==='horary'&&!c.moment.trim())return 'configuration'}
 return ''
}
