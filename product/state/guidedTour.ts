import type {LearningState} from './learning'
import {TODAY} from './model'

export const tourSteps=['booking','client','chart','notes','messages','library','meeting','finance','reminders','services','automations','dashboard','directory','finish'] as const
export type TourStep=typeof tourSteps[number]
export type TourProgress={appointmentId:string;index:number;status:'active'|'paused'|'done'}
/** Tour progress records viewed explanations, never completion of work or payments. */
export function beginTour(state:LearningState,appointmentId:string,explicit=false):LearningState{
 if(!explicit&&(!state.enabled||state.tour||state.journey?.paused))return state
 const index=state.tour?.appointmentId===appointmentId&&state.tour.status!=='done'?state.tour.index:0
 return {...state,enabled:true,tour:{appointmentId,index,status:'active'}}
}
export function moveTour(state:LearningState,direction:1|-1):LearningState{
 if(!state.tour||state.tour.status!=='active')return state
 const index=Math.max(0,Math.min(tourSteps.length-1,state.tour.index+direction))
 const done=direction===1&&state.tour.index===tourSteps.length-1
 return {...state,tour:{...state.tour,index,status:done?'done':'active'}}
}
export function pauseTour(state:LearningState):LearningState{return state.tour?.status==='active'?{...state,tour:{...state.tour,status:'paused'}}:state}
export function practiceDay(timeZone:string,example=false,now=new Date()):string{
 if(example)return TODAY
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
 const get=(type:string)=>parts.find(p=>p.type===type)!.value
 return `${get('year')}-${get('month')}-${get('day')}`
}
