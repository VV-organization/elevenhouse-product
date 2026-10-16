import type {TwoFactorSetupData} from '../modules/settings-security'
import {emptyOwnBirth,type OwnBirthDetails} from './settings-export'
export type SettingsRequest={id:string;kind:'integration-connect'|'integration-disconnect'|'security-2fa'|'security-revoke'|'login-change'|'billing-plan'|'billing-method'|'verification'|'consents'|'delete-account'|'referral-link';target:string;payload:Record<string,unknown>;createdAt:string;status:'prepared'|'cancelled'}
export type IntegrationId='telegram'|'google-calendar'|'yookassa'|'zoom'|'instagram'
export type IntegrationDraft={account:string;resource:string;direction:'read'|'write'|'both';events:boolean}
export type SettingsPreferences={birth?:OwnBirthDetails;integrations:Partial<Record<IntegrationId,IntegrationDraft>>;notifications:{channels:{push:boolean;email:boolean;telegram:boolean};leads:boolean;payments:boolean;reviews:boolean;digest:boolean};consents:{record:'unset'|'allow'|'deny';models:'unset'|'allow'|'deny';marketing:'unset'|'allow'|'deny'};loyalty:{enabled:boolean;perVisit:number;redeemAt:number;reward:string;birthday:boolean;referral:boolean};verification:{name:string;qualification:string;links:string};requests:SettingsRequest[]}
export function defaultSettingsPreferences():SettingsPreferences{return {birth:emptyOwnBirth(),integrations:{},notifications:{channels:{push:false,email:false,telegram:false},leads:false,payments:false,reviews:false,digest:false},consents:{record:'unset',models:'unset',marketing:'unset'},loyalty:{enabled:false,perVisit:1,redeemAt:10,reward:'',birthday:false,referral:false},verification:{name:'',qualification:'',links:''},requests:[]}}
export function appendSettingsRequest(requests:SettingsRequest[],request:SettingsRequest){return [...requests.filter(r=>!(r.kind===request.kind&&r.target===request.target&&r.status==='prepared')),request]}
export function cancelSettingsRequest(requests:SettingsRequest[],id:string){return requests.map(r=>r.id===id?{...r,status:'cancelled' as const}:r)}
export function loyaltyError(value:SettingsPreferences['loyalty']){return value.enabled&&(!Number.isInteger(value.perVisit)||value.perVisit<1||value.perVisit>100||!Number.isInteger(value.redeemAt)||value.redeemAt<2||value.redeemAt>100||!value.reward.trim())?'invalid':''}
export function integrationDraftError(value:IntegrationDraft){return !value.account.trim()||!value.resource.trim()?'required':''}
export function verificationError(value:SettingsPreferences['verification'],files:{name:string;size:number}[]){if(!value.name.trim()||!value.qualification.trim())return 'required';if(files.length>6||files.some(f=>f.size>10*1024*1024))return 'files';if(!files.length&&!value.links.trim())return 'evidence';if(value.links.split('\n').filter(s=>s.trim()).some(s=>{try{const u=new URL(s);return !['http:','https:'].includes(u.protocol)||!!u.username||!!u.password}catch{return true}}))return 'url';return ''}
export type SettingsServerData={
 twoFactorSetup?:TwoFactorSetupData;
 integrations?:Partial<Record<IntegrationId,{status:'connected'|'disconnected'|'error';account?:string;checkedAt?:string;error?:string}>>;
 security?:{twoFactor:'enabled'|'disabled'|null;methods:{kind:string;destination:string;verified:boolean}[];sessions:{id:string;device:string;location?:string;lastSeen:string;current:boolean}[]};
 billing?:{plans:{id:string;name:string;monthly:number;annual:number;fee:number;features:string[]}[];currentPlanId?:string;cycle?:'month'|'year';nextCharge?:string;paymentMethod?:string;invoices:{id:string;date:string;amount:number;status:string;receiptUrl?:string}[]};
 verification?:{status:'not-submitted'|'pending'|'needs-info'|'verified'|'rejected';reason?:string;documents:{id:string;name:string;status:string}[]};
 referral?:{url?:string;terms:string;invited:number;active:number;reward:number;people:{id:string;name:string;status:string;reward:string}[]}
}
