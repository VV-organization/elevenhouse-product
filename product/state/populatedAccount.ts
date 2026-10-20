import {createMemberPractice} from './memberCore'
import {populatedModules} from './populatedModules'
import {parsePractice,type Practice,type Appointment} from './model'

type StorageAccess=Pick<Storage,'getItem'|'setItem'>
const revision='populated-2026-10-20-v2'
function object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value)}
/** Add missing fixtures by stable identity. Existing edits always win. */
export function mergePopulation(saved:unknown,seed:unknown):unknown{
 if(saved===undefined)return structuredClone(seed)
 if(Array.isArray(saved)&&Array.isArray(seed)){
  if(!saved.length)return structuredClone(seed)
  if(!seed.every(row=>object(row)&&typeof row.id==='string'))return saved
  const byId=new Map(seed.map(row=>[row.id,row])),ids=new Set(saved.map(row=>object(row)?row.id:undefined))
  return [...saved.map(row=>object(row)&&byId.has(row.id)?mergePopulation(row,byId.get(row.id)):row),...seed.filter(row=>!ids.has(row.id)).map(row=>structuredClone(row))]
 }
 if(object(saved)&&object(seed))return Object.fromEntries([...new Set([...Object.keys(seed),...Object.keys(saved)])].map(key=>[key,mergePopulation(saved[key],seed[key])]))
 return saved
}
function collides(a:Appointment,b:Appointment){const min=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));return a.status!=='cancelled'&&b.status!=='cancelled'&&a.date===b.date&&min(a.time)<min(b.time)+b.duration&&min(b.time)<min(a.time)+a.duration}
export function populatedPractice(saved:Practice):Practice{
 const seed=createMemberPractice()
 const clients=mergePopulation(saved.clients,seed.clients) as Practice['clients']
 const appointments=saved.appointments.map(a=>{const original=seed.appointments.find(s=>s.id===a.id&&s.clientId===a.clientId&&s.title===a.title);return original?{...original,...a}:a})
 for(const a of seed.appointments)if(!appointments.some(b=>b.id===a.id||collides(a,b)))appointments.push(structuredClone(a))
 return {...saved,clients,appointments,clientStages:mergePopulation(saved.clientStages,seed.clientStages) as Practice['clientStages']}
}
/** Upgrade only the two explicit fictional accounts, once, keeping a recoverable snapshot. */
export function populateSavedAccount(storage:StorageAccess,account:string,saved:Practice):Practice{
 if(!saved.isExample||!['example','member'].includes(account))return saved
 const scope=account==='member'?'member-anna':'example'
 return populateScope(storage,scope,`eh-product-v1-${scope}`,saved)
}
export function populateShowcaseAccount(storage:StorageAccess,view:string,saved:Practice):Practice{
 if(!saved.isExample||!['workspace','mobile','client','page','admin'].includes(view))return saved
 return populateScope(storage,`showcase:${view}:v1`,`eh-showcase:${view}:practice`,saved)
}
function populateScope(storage:StorageAccess,scope:string,practiceKey:string,saved:Practice):Practice{
 const marker=`eh-product-v2-${scope}-${revision}`
 if(storage.getItem(marker)){populateCalculationExamples(storage,scope,saved);return saved}
 const practice=populatedPractice(saved)
 if(!parsePractice(JSON.stringify(practice)))throw new Error('Invalid populated practice')
 const appointmentIds=new Set(practice.appointments.map(a=>a.id)),clientIds=new Set(practice.clients.map(c=>c.id))
 const writes:Record<string,string>={},backup:Record<string,string|null>={[practiceKey]:storage.getItem(practiceKey)}
 for(const [key,rawSeed] of Object.entries(populatedModules)){
  const storageKey=`eh-product-v2-${scope}-${key}`,raw=storage.getItem(storageKey)
  backup[storageKey]=raw
  let existing:unknown
  if(raw!==null){try{existing=JSON.parse(raw)}catch{continue}}
  let seed=structuredClone(rawSeed)
  if(Array.isArray(seed))seed=seed.filter(row=>!row.clientId||clientIds.has(row.clientId)).filter(row=>!row.appointmentId||appointmentIds.has(row.appointmentId))
  // A saved "unavailable" wallet and untouched blank profile are old initial states.
  if(key==='wallet-snapshot'&&object(existing)&&existing.available===null&&existing.pending===null&&existing.held===null)existing=undefined
  if(key==='public-profile'&&object(existing)&&object(existing.draft)&&!existing.prepared&&Object.entries(existing.draft).every(([field,value])=>field==='name'||field==='visibility'&&value==='hidden'||value===''||Array.isArray(value)&&!value.length)){
   if(object(seed)&&object(seed.draft))seed.draft.name=existing.draft.name
   existing=undefined
  }
  if(key==='payments'&&Array.isArray(existing)&&Array.isArray(seed)){
   const legacy:Record<string,string>={'EH-1045':'session-marina','EH-1044':'session-dmitry','EH-1043':'session-olga'}
   existing=existing.map(p=>{const a=practice.appointments.find(a=>a.id===legacy[p.id]&&a.clientId===p.clientId);return a&&!p.appointmentId&&p.serviceId===(a.serviceId??(a.clientId==='olga'?'followup':'natal'))?{...p,appointmentId:a.id}:p})
   const linked=new Set((existing as Array<{appointmentId?:string}>).map(p=>p.appointmentId).filter(Boolean))
   const savedIds=new Set((existing as Array<{id:string}>).map(p=>p.id))
   seed=seed.filter(p=>savedIds.has(p.id)||!p.appointmentId||!linked.has(p.appointmentId))
  }
  if(['client-cases','money-requests'].includes(key)&&Array.isArray(seed)){
   const available=JSON.parse(writes[`eh-product-v2-${scope}-payments`]??'[]') as Array<{id:string}>
   seed=seed.filter(row=>!row.paymentId||available.some(p=>p.id===row.paymentId))
  }
  if(key==='reminders'&&Array.isArray(seed))seed=seed.filter(r=>!r.eventId||r.eventId.startsWith('birthday-')||appointmentIds.has(r.eventId))
  if(key==='appointment-briefs'&&object(seed))seed=Object.fromEntries(Object.entries(seed).filter(([id])=>appointmentIds.has(id)))
  const merged=key==='notification-read'&&Array.isArray(existing)&&Array.isArray(seed)?[...new Set([...existing,...seed])]:mergePopulation(existing,seed)
  writes[storageKey]=JSON.stringify(merged)
 }
 // Save original data before the first write. If storage fails, the marker stays absent
 // and retry merges by ID without duplicating rows or losing the original backup.
 const backupKey=`${marker}-backup`
 if(!storage.getItem(backupKey))storage.setItem(backupKey,JSON.stringify(backup))
 storage.setItem(practiceKey,JSON.stringify(practice))
 for(const [key,value] of Object.entries(writes))storage.setItem(key,value)
 storage.setItem(marker,'complete')
 storage.setItem(`eh-product-v2-${scope}-calculation-examples-v1`,'complete')
 return practice
}

/** Upgrade only calculation examples; never re-create clients or transactions deleted after v2. */
function populateCalculationExamples(storage:StorageAccess,scope:string,practice:Practice){
 const marker=`eh-product-v2-${scope}-calculation-examples-v1`
 if(storage.getItem(marker))return
 const writes:Record<string,string>={},backup:Record<string,string|null>={}
 for(const name of ['saved-astronomy-calculations','calculation-child-profiles']){
  const key=`eh-product-v2-${scope}-${name}`,raw=storage.getItem(key);backup[key]=raw
  let existing:unknown;try{existing=raw===null?undefined:JSON.parse(raw)}catch{continue}
  let seed=populatedModules[name]
  if(Array.isArray(seed))seed=seed.filter(r=>practice.clients.some(c=>c.id===r.clientId))
  else if(object(seed))seed=Object.fromEntries(Object.entries(seed).filter(([id])=>practice.clients.some(c=>c.id===id)))
  writes[key]=JSON.stringify(mergePopulation(existing,seed))
 }
 if(!storage.getItem(`${marker}-backup`))storage.setItem(`${marker}-backup`,JSON.stringify(backup))
 for(const [key,value] of Object.entries(writes))storage.setItem(key,value)
 storage.setItem(marker,'complete')
}
