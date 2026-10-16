export type CalculationAttachment={title:string;createdAt:string;result:unknown;interpretation:string}
export type InterpretationRequest={title:string;result:unknown;question:string;language:'ru'|'en'}
export type InterpretationResponse={status:'ready';text:string}|{status:'unavailable'|'error';message:string}
export type InterpretCalculation=(request:InterpretationRequest)=>Promise<InterpretationResponse>|InterpretationResponse
/** Immutable snapshot: later edits to the working result never change a shared report. */
export function calculationAttachment(title:string,result:unknown,interpretation:string,createdAt:string):CalculationAttachment{return {title,result:structuredClone(result),interpretation:interpretation.trim(),createdAt}}
export function calculationDraftKey(clientId:string|undefined,result:unknown){return `${clientId||'quick'}:${JSON.stringify(result)}`}
