import type {AstronomyResult} from './calculationPresentation'
import type {CalculationRequest} from './calculationMethods'
import type {NatalChartData} from './natalChart'
export type SavedAstronomy={id:string;at:string;clientId:string;title:string;request?:CalculationRequest;result:AstronomyResult|{kind:'natal-reference';data:NatalChartData}}
export function snapshotAstronomy(value:SavedAstronomy):SavedAstronomy{return JSON.parse(JSON.stringify(value))}
export function attachAstronomy(value:SavedAstronomy,clientId:string):SavedAstronomy{return {...value,clientId}}
export type LinkedChild={name:string;date:string;time:string;place:string;unknownTime:boolean}
export function saveLinkedChild(records:Record<string,LinkedChild>,parentId:string,child:LinkedChild){if(!parentId||!child.name.trim()||!child.date||!child.place.trim()||!child.unknownTime&&!child.time)throw new Error('Incomplete child profile');return {...records,[parentId]:{...child,name:child.name.trim(),place:child.place.trim()}}}
