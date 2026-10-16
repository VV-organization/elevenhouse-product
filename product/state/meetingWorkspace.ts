/** Frontend boundary: all live state and generated resources come from an adapter. */
export type MeetingResource = {status:'empty'|'processing'|'ready'|'error';url?:string;text?:string;message?:string}
export type MeetingMaterial = {id:string;title:string;url:string;visibility:'private'|'client'}
export type MeetingMessage = {id:string;author:string;text:string;sentAt:string;attachment?:{name:string;url:string}}
export type MeetingSession = {
 appointmentId:string;connection:'disconnected'|'connecting'|'connected'|'ended'|'error';
 microphone:boolean;camera:boolean;screen:boolean;chart:boolean;
 recording:'off'|'recording'|'processing';recordingConsent:boolean;
 messages:MeetingMessage[];recordingFile:MeetingResource;transcript:MeetingResource;
 materials:MeetingMaterial[];message?:string
}
export type MeetingAction = {type:'join'|'leave'|'refresh'}|{type:'microphone'|'camera'|'screen'|'chart'|'recording';enabled:boolean}|{type:'message';text:string;file?:File}
export type MeetingAdapter = {
 /** Host renders real provider video; the workspace never impersonates a participant. */
 /** Resolve only after command acknowledgement; reject failed delivery. Returned state must belong to this appointment. */
 execute:(appointmentId:string,action:MeetingAction)=>Promise<MeetingSession>;
 subscribe?:(appointmentId:string,onChange:(session:MeetingSession)=>void)=>()=>void;
 summarize?:(request:{appointmentId:string;transcript:string})=>Promise<{text:string}>
}
export function emptyMeetingSession(appointmentId:string):MeetingSession{return {appointmentId,connection:'disconnected',microphone:false,camera:false,screen:false,chart:false,recording:'off',recordingConsent:false,messages:[],recordingFile:{status:'empty'},transcript:{status:'empty'},materials:[]}}
export function safeMeetingUrl(value:unknown):value is string{if(typeof value!=='string')return false;try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password}catch{return false}}
export function validMeetingSession(value:unknown,appointmentId:string):value is MeetingSession {
 try{const s=value as MeetingSession;const resource=(r:MeetingResource)=>!!r&&['empty','processing','ready','error'].includes(r.status)&&(r.url===undefined||safeMeetingUrl(r.url))&&(r.text===undefined||typeof r.text==='string')&&(r.message===undefined||typeof r.message==='string');
 return !!s&&s.appointmentId===appointmentId&&['disconnected','connecting','connected','ended','error'].includes(s.connection)&&['off','recording','processing'].includes(s.recording)&&['microphone','camera','screen','chart','recordingConsent'].every(k=>typeof s[k as keyof MeetingSession]==='boolean')&&resource(s.recordingFile)&&resource(s.transcript)&&Array.isArray(s.messages)&&s.messages.every(m=>typeof m.id==='string'&&typeof m.author==='string'&&typeof m.text==='string'&&typeof m.sentAt==='string'&&(!m.attachment||typeof m.attachment.name==='string'&&safeMeetingUrl(m.attachment.url)))&&Array.isArray(s.materials)&&s.materials.every(m=>typeof m.id==='string'&&typeof m.title==='string'&&safeMeetingUrl(m.url)&&['private','client'].includes(m.visibility))&&(s.message===undefined||typeof s.message==='string')
 }catch{return false}
}
export function canExecuteMeetingAction(s:MeetingSession,action:MeetingAction){
 if(action.type==='refresh')return true;
 if(action.type==='join')return ['disconnected','ended','error'].includes(s.connection);
 if(action.type==='leave')return s.connection==='connected'||s.connection==='connecting';
 if(s.connection!=='connected')return false;
 if(action.type==='recording')return !action.enabled||s.recordingConsent&&s.recording!=='processing';
 if(action.type==='message')return !!action.text.trim()||!!action.file;
 return true
}
