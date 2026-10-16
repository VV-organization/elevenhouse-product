import type {AIResult} from './communication-ai'
import type {ReviewRecord,Publication} from './communication-workflows'
export type ContentServerData={aiResults?:AIResult[];astroEvents?:{id:string;date:string;title:string;description:string}[];stats?:Record<string,{views:number;reactions:number;asOf:string}>;subscription?:{subscribers:number;mrr:number;currency:string;asOf:string};delivery?:{postId:string;requestId?:string;status:'published'|'failed';at:string;message?:string}[]}
export type ReviewReplyRequest={id:string;reviewId:string;text:string;status:'prepared'|'cancelled';createdAt:string}
export type ReviewReplyResult={requestId:string;reviewId:string;status:'published'|'failed';text?:string;message?:string;at:string}
export type ReviewServerData={aiResults?:AIResult[];replyResults?:ReviewReplyResult[]}
export function reviewDistribution(reviews:ReviewRecord[]){return [5,4,3,2,1].map(rating=>({rating,count:reviews.filter(r=>r.status==='published'&&r.rating===rating).length}))}
export function prepareReviewReply(existing:ReviewReplyRequest[],reviewId:string,text:string,id:string,createdAt:string,results:ReviewReplyResult[]=[]){
 if(!reviewId||!text.trim())throw new Error('text')
 if(existing.some(r=>r.reviewId===reviewId&&r.status==='prepared'&&!results.some(s=>s.requestId===r.id)))throw new Error('pending')
 return [...existing,{id,reviewId,text:text.trim(),status:'prepared' as const,createdAt}]
}
export function confirmedReply(reviewId:string,requests:ReviewReplyRequest[],results:ReviewReplyResult[]){return [...results].filter(r=>r.reviewId===reviewId&&r.status==='published'&&requests.some(q=>q.id===r.requestId&&q.reviewId===reviewId&&q.status==='prepared')).sort((a,b)=>b.at.localeCompare(a.at))[0]}
export function calendarPublications(posts:Publication[],month:string){return [...posts].filter(p=>/^\d{4}-\d{2}$/.test(month)&&p.date?.slice(0,7)===month).sort((a,b)=>`${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))}
export function safeMetric(value:unknown){return typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null}
