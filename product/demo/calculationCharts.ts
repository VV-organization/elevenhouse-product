/** User-requested visual templates. Not an ephemeris; never use outside example mode. */
import {hdCentreKeys,hdChannelTopology,type HDCentre,type HDResultChart,type HDActivation,type AstroLayer,type AstrologyResult,type SuppliedAspect,type CalculationLabel} from '../state/calculationPresentation'
import {norm,houseNumber,aspectDefinitions} from '../state/natalChart'
import type {CalculationRequest} from '../state/calculationMethods'
export const label=(ru:string,en:string):CalculationLabel=>({ru,en})
export const demoNote=label('Пример расчёта · демонстрационные данные, не астрономический расчёт.','Example calculation · demonstration data, not an astronomical calculation.')
export const planetLabels:Record<string,CalculationLabel>=Object.fromEntries([
 ['sun','Солнце','Sun'],['earth','Земля','Earth'],['moon','Луна','Moon'],['mercury','Меркурий','Mercury'],['venus','Венера','Venus'],['mars','Марс','Mars'],['jupiter','Юпитер','Jupiter'],['saturn','Сатурн','Saturn'],['uranus','Уран','Uranus'],['neptune','Нептун','Neptune'],['pluto','Плутон','Pluto'],['node','Северный узел','North node'],['south-node','Южный узел','South node'],
].map(([key,ru,en])=>[key,label(ru,en)]))
export const modeLabels:Record<string,CalculationLabel>=Object.fromEntries([
 ['natal','Натальная карта','Natal chart'],['transits','Транзиты','Transits'],['progress','Прогрессии','Progressions'],['directions','Дирекции','Directions'],['return','Возвращение планеты','Planet return'],['synastry','Синастрия','Synastry'],['composite','Композит','Composite'],['solar','Соляр','Solar return'],['child','Детская карта','Child chart'],['bodygraph','Бодиграф','Bodygraph'],['pair','Партнёрский бодиграф','Partnership bodygraph'],
].map(([key,ru,en])=>[key,label(ru,en)]))
export function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
const seedOf=(birth:CalculationRequest['birth'])=>hash([birth.date,birth.unknownTime?'unknown':birth.time,birth.place.toLowerCase()].join('|'))
function layer(birth:CalculationRequest['birth'],id:string,title:CalculationLabel,request:CalculationRequest):AstroLayer{
 const seed=seedOf(birth),rotation=(seed%36000)/100,asc=norm(rotation+48+(hash(request.houseSystem)%18)),equal=['Equal','Whole sign'].includes(request.houseSystem)
 const cusps=Array.from({length:12},(_,i)=>norm((request.houseSystem==='Whole sign'?Math.floor(asc/30)*30:asc)+i*30+(equal?0:Math.sin(i*Math.PI/3)*7)))
 const keys=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','node']
 const offsets=[0,62,17,326,121,241,272,188,194,218,130]
 return {id,label:title,utc:`${birth.date}T${birth.unknownTime?'12:00':birth.time}:00.000Z`,...(!birth.unknownTime?{cusps,ascendant:cusps[0],midheaven:cusps[9]}:{}),positions:keys.map((key,i)=>{
  const longitude=norm(rotation+offsets[i]+(hash(`${seed}:${key}`)%400)/100+(key==='node'&&request.nodes==='true'?1.6:0))
  return {key,label:planetLabels[key],longitude,retrograde:i>2&&(seed+i)%4===0,...(!birth.unknownTime?{house:houseNumber(longitude,cusps)!}:{})}
 })}
}
function shifted(source:AstroLayer,rotation:number,id:string,title:CalculationLabel):AstroLayer{
 const cusps=source.cusps?.map(n=>norm(n+rotation))
 return {...source,id,label:title,...(cusps?{cusps,ascendant:cusps[0],midheaven:cusps[9]}:{}),positions:source.positions.map(p=>({...p,longitude:norm(p.longitude+rotation)}))}
}
const midpoint=(a:number,b:number)=>norm(a+(norm(b-a+180)-180)/2)
function aspects(layers:AstroLayer[],request:CalculationRequest):SuppliedAspect[]{
 const names:Record<string,CalculationLabel>={conjunction:label('Соединение','Conjunction'),sextile:label('Секстиль','Sextile'),square:label('Квадрат','Square'),trine:label('Тригон','Trine'),opposition:label('Оппозиция','Opposition'),semisextile:label('Полусекстиль','Semisextile'),quincunx:label('Квиконс','Quincunx'),semisquare:label('Полуквадрат','Semisquare')}
 const definitions=[...aspectDefinitions,...(request.minorAspects?[{key:'semisextile',angle:30,orb:2,tone:'neutral' as const},{key:'quincunx',angle:150,orb:3,tone:'neutral' as const},{key:'semisquare',angle:45,orb:2,tone:'hard' as const}]:[])]
 const a=layers[0],b=layers[1]||a,result:SuppliedAspect[]=[]
 a.positions.forEach((p,i)=>b.positions.forEach((q,j)=>{if(a===b&&j<=i)return;const distance=Math.abs(norm(p.longitude-q.longitude+180)-180),d=definitions.find(d=>Math.abs(distance-d.angle)<=d.orb*request.orbMultiplier);if(d)result.push({id:`${a.id}:${p.key}:${b.id}:${q.key}`,from:{layer:a.id,planet:p.key},to:{layer:b.id,planet:q.key},label:names[d.key],angle:d.angle,orb:Math.abs(distance-d.angle),tone:d.tone})}))
 return result
}
export function astrologyTemplate(request:CalculationRequest):AstrologyResult{
 const natal=layer(request.birth,'natal',request.subjectName?label(request.subjectName,request.subjectName):label('Карта человека','Birth chart'),request)
 const other=request.partner?layer(request.partner,'partner',label('Карта партнёра','Partner chart'),request):undefined
 const date=request.targetDate,target=layer({date,time:'12:00',place:request.targetPlace,unknownTime:request.birth.unknownTime},'forecast',modeLabels[request.mode],request)
 const age=(Date.parse(date)-Date.parse(request.birth.date))/86400000/365.25
 let layers:AstrologyResult['layers']=[natal]
 if(request.mode==='synastry')layers=[natal,other!]
 else if(request.mode==='transits')layers=[natal,target]
 else if(request.mode==='composite'){
  const cusps=natal.cusps&&other?.cusps?natal.cusps.map((n,i)=>midpoint(n,other.cusps![i])):undefined
  layers=[{id:'composite',label:modeLabels.composite,utc:natal.utc,...(cusps?{cusps,ascendant:cusps[0],midheaven:cusps[9]}:{}),positions:natal.positions.map((p,i)=>{const longitude=midpoint(p.longitude,other!.positions[i].longitude);return {key:p.key,label:p.label,longitude,...(cusps?{house:houseNumber(longitude,cusps)!}:{})}})}]
 }else if(request.mode==='progress'||request.mode==='directions'){
  const p=shifted(natal,age*(request.mode==='directions'?1:1.014),'forecast',modeLabels[request.mode]);p.utc=target.utc
  if(request.mode==='progress')p.positions=p.positions.map((x,i)=>{const longitude=norm(x.longitude+(i===1?age*12.2:0));return {...x,longitude,...(p.cusps?{house:houseNumber(longitude,p.cusps)!}:{})}})
  layers=[natal,p]
 }else if(request.mode==='solar'||request.mode==='return'){
  const key=request.mode==='solar'?'sun':request.returnPlanet||'sun',n=natal.positions.find(p=>p.key===key)!,t=target.positions.find(p=>p.key===key)!
  layers=[shifted(target,n.longitude-t.longitude,'return',modeLabels[request.mode])]
 }else if(request.mode==='child')layers=[{...natal,label:modeLabels.child}]
 return {kind:'astrology',provenance:'demonstration',title:modeLabels[request.mode],zodiac:label('Тропический зодиак','Tropical zodiac'),houseSystem:request.houseSystem,layers,aspects:aspects(layers,request),notes:[demoNote,...(request.birth.unknownTime?[label('Время рождения неизвестно: дома и оси не показаны.','Birth time unknown: houses and angles are omitted.')]:[])]}
}
const centreGates:Record<HDCentre,number[]>={head:[64,61,63],ajna:[47,24,4,17,43,11],throat:[62,23,56,16,20,35,12,45,31,8,33],g:[1,7,13,10,25,15,46,2],heart:[21,51,26,40],spleen:[48,57,44,50,32,28,18],solar:[36,22,37,6,49,55,30],sacral:[5,14,29,34,27,59,42,3,9],root:[53,60,52,54,38,58,19,39,41]}
const centreOf=(gate:number)=>hdCentreKeys.find(c=>centreGates[c].includes(gate))!
const channelNames=['Абстракции|Abstraction','Осознанности|Awareness','Логики|Logic','Принятия|Acceptance','Структурирования|Structuring','Любознательности|Curiosity','Лидерства|Leadership','Вдохновения|Inspiration','Свидетеля|Witness','Пробуждения|Awakening','Ресурсов|Resources','Опыта|Experience','Открытости|Openness','Таланта|Talent','Интуиции|Intuition','Харизмы|Charisma','Направления|Direction','Ритма|Rhythm','Открытия|Discovery','Исследования|Exploration','Посвящения|Initiation','Формы|Form','Общности|Community','Передачи|Transmission','Близости|Intimacy','Силы|Power','Сохранения|Preservation','Мутации|Mutation','Созревания|Maturation','Концентрации|Concentration','Преображения|Transformation','Борьбы|Struggle','Суждения|Judgement','Узнавания|Recognition','Эмоциональности|Emoting','Синтеза|Synthesis']
export function bodygraphTemplate(birth:CalculationRequest['birth'],id:string,title:CalculationLabel,transitDate?:string):HDResultChart{
 const seed=seedOf(birth),keys=['sun','earth','moon','node','south-node','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']
 // Curated channel families make every example informative while preserving topology.
 const families=[[34,20,57,10,5,15],[43,23,17,62,61,24],[40,37,59,6,19,49],[1,8,13,33,25,51]]
 const family=families[seed%families.length]
 const activations:HDActivation[]=(['personality','design'] as const).flatMap((side,s)=>keys.map((planet,i)=>({planet,label:planetLabels[planet],side,gate:i<family.length?family[(i+s*2)%family.length]:1+hash(`${seed}:${side}:${i}`)%64,line:1+hash(`${seed}:${side}:${i}:line`)%6})))
 if(transitDate)activations.push(...keys.map((planet,i)=>({planet,label:planetLabels[planet],side:'transit' as const,gate:1+hash(`${transitDate}:${i}`)%64,line:1+hash(`${transitDate}:${i}:line`)%6})))
 const gates=new Set(activations.map(a=>a.gate)),defined=new Set<HDCentre>(),edges=new Map<HDCentre,Set<HDCentre>>()
 const channels=hdChannelTopology.flatMap((pair,i)=>{if(!pair.every(g=>gates.has(g)))return [];const a=centreOf(pair[0]),b=centreOf(pair[1]);defined.add(a);defined.add(b);if(!edges.has(a))edges.set(a,new Set());if(!edges.has(b))edges.set(b,new Set());edges.get(a)!.add(b);edges.get(b)!.add(a);const [ru,en]=channelNames[i].split('|');return [{gates:[pair[0],pair[1]] as [number,number],label:label(ru,en),defined:true,description:label('Тема для обсуждения: как этот ресурс проявляется в работе, решениях и отношениях.','Discussion topic: how this resource shows up in work, decisions and relationships.')}]})
 function reach(start:HDCentre){const seen=new Set<HDCentre>(),queue=[start];while(queue.length){const c=queue.pop()!;if(seen.has(c))continue;seen.add(c);queue.push(...edges.get(c)||[])}return seen}
 const connected=reach('throat'),motor=['sacral','heart','solar','root'].some(c=>connected.has(c as HDCentre)),generator=defined.has('sacral')
 const type=generator?(motor?label('Манифестирующий генератор','Manifesting Generator'):label('Генератор','Generator')):motor?label('Манифестор','Manifestor'):label('Проектор','Projector')
 const seen=new Set<HDCentre>();let groups=0;for(const c of defined)if(!seen.has(c)){groups++;for(const k of reach(c))seen.add(k)}
 return {id,label:title,type,profile:[activations[0].line,activations[13].line],authority:defined.has('solar')?label('Эмоциональный','Emotional'):generator?label('Сакральный','Sacral'):defined.has('spleen')?label('Селезёночный','Splenic'):label('Самопроецируемый','Self-projected'),strategy:generator?label('Откликаться','Respond'):motor?label('Информировать','Inform'):label('Ждать приглашения','Wait for invitation'),definition:groups===1?label('Единичное','Single definition'):label(`Разделённое · ${groups} группы`,`Split definition · ${groups} groups`),signature:generator?label('Удовлетворение','Satisfaction'):motor?label('Покой','Peace'):label('Успех','Success'),notSelf:generator?label('Фрустрация','Frustration'):motor?label('Гнев','Anger'):label('Горечь','Bitterness'),centres:hdCentreKeys.map(key=>({key,defined:defined.has(key)})),channels,activations}
}
