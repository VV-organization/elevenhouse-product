/** Example-account adapters only. These templates never claim ephemeris or AI accuracy. */
import type {AstronomyResult} from '../state/calculationPresentation'
import {astrologyModes,dateParts,type CalculationRequest,type CalculationResponse} from '../state/calculationMethods'
import {validCalendarRange,type AstroCalendarAdapter,type AstroEvent} from '../state/astroCalendar'
import type {InterpretCalculation} from '../state/calculationDelivery'
import type {ToolCalculationAdapters} from '../modules/Tools'
import type {SavedAstronomy} from '../state/astronomyHistory'
import {tr} from '../i18n'
import {astrologyTemplate,bodygraphTemplate,demoNote,label,modeLabels} from './calculationCharts'
const validBirth=(birth:CalculationRequest['birth']|undefined)=>!!birth&&!!dateParts(birth.date)&&!!birth.place.trim()&&(birth.unknownTime||/^([01]\d|2[0-3]):[0-5]\d$/.test(birth.time))
export function demoCalculate(request:CalculationRequest):CalculationResponse<AstronomyResult>{
 if(!validBirth(request.birth)||!dateParts(request.targetDate)||!Number.isFinite(request.orbMultiplier)||request.orbMultiplier<=0||(['synastry','composite','pair'].includes(request.mode)&&!validBirth(request.partner)))return {status:'error',request,message:tr('Заполните корректные данные рождения и дату расчёта.','Complete valid birth details and the calculation date.')}
 if(request.method==='astrology'){
  if(!astrologyModes.includes(request.mode as typeof astrologyModes[number])||(request.mode==='return'&&!['sun','moon','mercury','venus','mars','jupiter','saturn'].includes(request.returnPlanet||'sun')))return {status:'error',request,message:tr('Выберите режим расчёта.','Choose a calculation mode.')}
  return {status:'ready',request,result:astrologyTemplate(request)}
 }
 if(!['bodygraph','pair','transits'].includes(request.mode))return {status:'error',request,message:tr('Выберите режим бодиграфа.','Choose a bodygraph mode.')}
 const person=request.subjectName?label(request.subjectName,request.subjectName):label('Личный бодиграф','Personal bodygraph')
 return {status:'ready',request,result:{kind:'human-design',provenance:'demonstration',title:request.mode==='transits'?label('Транзиты дизайна человека','Human Design transits'):modeLabels[request.mode],charts:[bodygraphTemplate(request.birth,'person',person,request.mode==='transits'?request.targetDate:undefined),...(request.mode==='pair'?[bodygraphTemplate(request.partner!,'partner',label('Бодиграф партнёра','Partner bodygraph'))]:[])],...(request.mode==='pair'?{comparison:'partnership' as const}:{}),notes:[demoNote]}}
}
export function demoRequest(client:{name:string;birthDate:string;birthTime:string;birthPlace:string;unknownTime:boolean},mode='natal',date='2026-10-15'):CalculationRequest{
 return {method:['bodygraph','pair'].includes(mode)?'human-design':'astrology',mode,birth:{date:client.birthDate,time:client.birthTime,place:client.birthPlace,unknownTime:client.unknownTime},targetDate:date,targetPlace:client.birthPlace,houseSystem:'Placidus',nodes:'mean',minorAspects:false,orbMultiplier:1,subjectName:client.name}
}
const prefix='demo-chart-v1:'
export async function demoResolve(id:string):Promise<SavedAstronomy|null>{
 try{if(!id.startsWith(prefix)||id.length>5000)return null;const request=JSON.parse(decodeURIComponent(id.slice(prefix.length))) as CalculationRequest,response=demoCalculate(request);if(response.status!=='ready')return null;return {id,at:`${request.targetDate}T12:00:00.000Z`,clientId:'',title:response.result.title.ru,request,result:response.result}}catch{return null}
}
const eventLabels=[['retro','Меркурий: начало ретроградного периода','Mercury: retrograde period begins'],['newmoon','Новолуние: начало нового цикла','New moon: a new cycle'],['fullmoon','Полнолуние: подведение итогов','Full moon: reflecting on progress'],['ingress','Венера переходит в следующий знак','Venus enters the next sign'],['eclipse','Солнечное затмение','Solar eclipse'],['transit','Юпитер — тригон к натальному Солнцу','Jupiter trine natal Sun'],['solar','Соляр: карта нового личного года','Solar return: a new personal year']]
export const demoCalendar:AstroCalendarAdapter=async request=>{
 if(!validCalendarRange(request.from,request.to))return {status:'error',message:tr('Проверьте диапазон дат.','Check the date range.')}
 const span=Math.round((Date.parse(request.to)-Date.parse(request.from))/86400000)+1
 if(span>366)return {status:'error',message:tr('Выберите период не больше года.','Choose a period of one year or less.')}
 const clients=request.clients.filter(c=>validBirth(demoRequest(c).birth)),events:AstroEvent[]=[]
 const generic={name:tr('Карта события','Event chart'),birthDate:'1990-03-14',birthTime:'08:25',birthPlace:'Москва',unknownTime:false}
 for(let offset=0;offset<span;offset+=3){
  const index=Math.floor(offset/3),[type,ru,en]=eventLabels[index%eventLabels.length],personal=['transit','solar'].includes(type),client=personal?clients[index%Math.max(clients.length,1)]:undefined
  if(personal&&!client)continue
  const date=new Date(Date.parse(request.from+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10),calculation=demoRequest(client||generic,type==='solar'?'solar':'transits',date)
  events.push({id:`demo-event:${date}:${type}:${client?.id||'general'}`,date,time:'12:00',type,title:tr(ru,en)+(client?' · '+client.name:''),description:'',clientId:client?.id||'',origin:'calculation',calculationId:prefix+encodeURIComponent(JSON.stringify(calculation))})
 }
 return {status:'ready',events,moon:{date:request.from,phase:tr('Растущая Луна','Waxing Moon'),sign:tr('Телец','Taurus'),illumination:64,source:tr('Демонстрационный шаблон','Demonstration template')},readiness:request.clients.map(c=>({clientId:c.id,status:clients.some(x=>x.id===c.id)?'ready' as const:'missing-data' as const,message:clients.some(x=>x.id===c.id)?tr('Карта подготовлена','Chart prepared'):tr('Заполните данные рождения','Complete birth details'),...(clients.some(x=>x.id===c.id)?{calculationId:prefix+encodeURIComponent(JSON.stringify(demoRequest(c,'natal',request.from)))}:{})}))}
}
export const demoInterpret:InterpretCalculation=({title,question,language})=>({status:'ready',text:language==='ru'?[
 'Черновик разбора',title,
 'Основная тема\nБаланс личной инициативы и сотрудничества. Гармоничные связи показывают опору на общение и последовательность, а напряжённые — темы, которые полезно обсудить подробнее.',
 'Ресурсы\nУмение видеть общую картину, замечать потребности собеседника и переводить идеи в понятные шаги. На консультации можно сопоставить эти темы с конкретными ситуациями клиента.',
 'Вопросы для встречи\nВ каких задачах сейчас больше всего энергии? Где ожидания расходятся с возможностями? Какой небольшой шаг поможет проверить выбранное направление?',
 ...(question.trim()?[`Запрос для обсуждения\n${question.trim()}`]:[]),
 'Следующий шаг\nВыбрать одну ситуацию, описать желаемый результат и договориться о наблюдениях до следующей встречи.',
].join('\n\n'):[
 'Interpretation draft',title,
 'Main theme\nBalancing personal initiative and collaboration. Harmonious connections illustrate resources while challenging connections suggest topics to explore.',
 'Resources\nSeeing the larger picture, listening to others and turning ideas into practical steps. Discuss these themes using concrete situations.',
 'Questions for the session\nWhich activities give you energy? Where do expectations exceed capacity? What small step could help test a direction?',
 ...(question.trim()?[`Discussion request\n${question.trim()}`]:[]),
 'Next step\nChoose one situation, define a desired outcome and agree what to observe before the next session.',
].join('\n\n')})
export const demoDraft:NonNullable<ToolCalculationAdapters['requestDraft']>=async request=>({status:'ready',text:request.kind==='journal-question'?tr('Что сегодня помогало сохранять свой ритм, а что отвлекало? Запишите один момент и небольшой шаг на завтра.','What helped you maintain your rhythm today, and what distracted you? Note one moment and a small step for tomorrow.'):tr(`Трактовка: ${request.title||'тема карты'}.\n\nРассмотрите, как эта тема проявляется в решениях, отношениях и повседневных привычках. Сопоставьте наблюдения с опытом клиента, отметьте ресурс и выберите один вопрос для следующей встречи.`,`Interpretation: ${request.title||'chart theme'}.\n\nExplore how this theme appears in decisions, relationships and habits. Compare observations with the client’s experience, identify a resource and choose a question for the next session.`)})
export function exampleCalculationAdapters(example:boolean,supplied:ToolCalculationAdapters={}):ToolCalculationAdapters{
 return example?{calculate:demoCalculate,interpret:demoInterpret,loadEvents:demoCalendar,resolveCalculation:demoResolve,requestDraft:demoDraft,requestQuestion:demoDraft,...supplied}:supplied
}

export const demoSky=(date:string)=>({date,phase:tr('Растущая Луна','Waxing Moon'),sign:tr('Телец','Taurus'),illumination:64,source:tr('Демонстрационный шаблон','Demonstration template'),transits:[{id:'demo-sky-1',title:tr('Солнце — тригон Юпитер','Sun trine Jupiter'),description:tr('Планы, новые возможности и обсуждение перспектив.','Plans, opportunities and discussing future directions.')},{id:'demo-sky-2',title:tr('Луна — секстиль Венера','Moon sextile Venus'),description:tr('Взаимодействие, поддержка и комфортный рабочий ритм.','Collaboration, support and a comfortable work rhythm.')}]})
