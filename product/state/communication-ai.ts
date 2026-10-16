export type AIConfig={task:string;model:string;prompt:string;inputs:string[];tone:string;length:string;format:string;guards:string[];hitl:'confirm'|'auto'|'edit';interp:string}
export type AIRequest={id:string;entityId:string;config:AIConfig;context:string;status:'prepared'|'cancelled';createdAt:string}
export type AIResult={requestId:string;status:'completed'|'failed';text?:string;error?:string;receivedAt:string}
export function aiDefaults(prompt='',task='analyze'):AIConfig{return {task,model:'astro',prompt,inputs:task==='content'?['transits','knowledge']:task==='reply'?['request','history']:['chart','request'],tone:'warm',length:'medium',format:task==='content'?'post':task==='reply'?'message':'text',guards:['cite','tone','nomed'],hitl:'confirm',interp:'natal'}}
export const aiVars=['карта','планеты','дома','аспекты','транзиты','запрос','имя','сегмент','история','продукт']
export function aiConfigError(config:AIConfig){
 if(!config.prompt.trim())return 'prompt'
 if(!['analyze','classify','score','summary','extract','reply','content'].includes(config.task)||!['astro','pro','general'].includes(config.model)||!['warm','friendly','expert','inspiring','brief'].includes(config.tone)||!['short','medium','long'].includes(config.length)||!['video','text','audio','bullets','json','message','post'].includes(config.format)||!['confirm','auto','edit'].includes(config.hitl))return 'option'
 if(!config.inputs.length||config.inputs.some(v=>!['chart','transits','profile','request','history','knowledge'].includes(v))||config.guards.some(v=>!['cite','tone','nomed','len','nopromise'].includes(v)))return 'source'
 if([...config.prompt.matchAll(/\{\{([^{}]+)\}\}/g)].some(m=>!aiVars.includes(m[1])))return 'variable'
 return ''
}
export function prepareAIRequest(entityId:string,config:AIConfig,context:string,id:string,createdAt:string):AIRequest{const error=aiConfigError(config);if(error)throw new Error(error);return {id,entityId,config:structuredClone(config),context,status:'prepared',createdAt}}
export function usableAIResult(request:AIRequest|undefined,result:AIResult|undefined){return !!request&&request.status==='prepared'&&result?.requestId===request.id&&result.status==='completed'&&!!result.text?.trim()}
