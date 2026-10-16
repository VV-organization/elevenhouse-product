const credentialKey=(key:string)=>/^(?:password|passwordhash|passwd|passphrase|secret|secretkey|clientsecret|apikey|privatekey|authorization|credentials?|accesstoken|refreshtoken|idtoken|tokens|token|authtoken|bearer|bearertoken|sessiontoken|sessionid|cookie|cookies|recoverycodes?|backupcodes?|totpsecret|otpsecret|accesskeyid|secretaccesskey|signature)$/i.test(key.replace(/[^a-z0-9]/gi,''))
function sanitizeString(value:string):string{
 const redacted=value.replace(/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z ]+ )?PRIVATE KEY-----/g,'[redacted]').replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi,'Bearer [redacted]').replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[redacted]')
 return redacted.replace(/https?:\/\/[^\s<>"']+/gi,raw=>{try{const url=new URL(raw);url.username='';url.password='';for(const key of [...url.searchParams.keys()])if(credentialKey(key)||/^x-(?:amz|goog)-/i.test(key)||/^(?:sig|auth|code)$/i.test(key))url.searchParams.delete(key);if(/(?:token|secret|password|credential|code)=/i.test(url.hash))url.hash='';return url.href}catch{return raw}})
}
export function redactExportCredentials(value:unknown):unknown{
 if(typeof value==='string')return sanitizeString(value)
 if(Array.isArray(value))return value.map(redactExportCredentials)
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>!credentialKey(key)).map(([key,val])=>[key,redactExportCredentials(val)]))
 return value
}
export type ExportStorage=Pick<Storage,'length'|'key'|'getItem'>
/** Only the active workspace namespace is read. Browser auth/session stores are excluded. */
export function createWorkspaceExport(storage:ExportStorage,scope:string,practice:unknown,latestModules:Record<string,unknown>={}){
 if(!scope||scope.length>200)throw new Error('Invalid workspace scope')
 const prefix=`eh-product-v2-${scope}-`,modules:Record<string,unknown>={},unparsed:string[]=[]
 for(let i=0;i<storage.length;i++){const key=storage.key(i);if(!key?.startsWith(prefix))continue;const name=key.slice(prefix.length);if(!name||credentialKey(name)||/^(auth|session|credentials)(?:-|$)/i.test(name))continue;const raw=storage.getItem(key);if(raw===null)continue;try{modules[name]=JSON.parse(raw)}catch{modules[name]=raw;unparsed.push(name)}}
 Object.assign(modules,latestModules)
 return {format:'elevenhouse-workspace',version:1,exportedAt:new Date().toISOString(),scope,practice:redactExportCredentials(practice),modules:redactExportCredentials(modules),unparsedModules:unparsed,excluded:['authentication credentials','browser sessions','other workspaces']}
}
export type OwnBirthDetails={date:string;time:string;timeUnknown:boolean;place:string;showOwnChart:boolean}
export const emptyOwnBirth=():OwnBirthDetails=>({date:'',time:'',timeUnknown:true,place:'',showOwnChart:false})
export function ownBirthError(value:OwnBirthDetails,today=new Date().toISOString().slice(0,10)){
 if(!value.date)return value.time||value.place||value.showOwnChart?'date':''
 const date=new Date(`${value.date}T12:00:00Z`)
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==value.date||value.date>today)return 'date'
 if(!value.timeUnknown&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time))return 'time'
 if(!value.place.trim())return 'place'
 return ''
}
