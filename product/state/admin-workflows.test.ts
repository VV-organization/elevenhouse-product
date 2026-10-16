import {describe,it,expect} from 'vitest'
import {addAdminRequest,adminActionError,cancelAdminRequest,configError,emptyAdminWorkspace,planEconomics,safeAdminUrl,type AdminRecord,type AdminRequest} from './admin-workflows'
const dispute:AdminRecord={id:'d',kind:'dispute',name:'Client',status:'open',orderId:'order-1',paymentId:'payment-1',paidAmount:100,refundedAmount:25,currency:'RUB'}
const request:AdminRequest={id:'r',target:'d',kind:'refund-partial',reason:'Duplicate charge',actor:'Admin',payload:{amount:10},createdAt:'2026-10-16T00:00:00Z',status:'prepared'}
describe('admin decisions preserve authoritative state',()=>{
 it('uses refundable remainder, rejects missing payment history and excess precision',()=>{
  expect(adminActionError('admin',dispute,'refund-full',{amount:75},'Reason')).toBe('')
  for(const amount of [0,-1,75,76,1.001,NaN])expect(adminActionError('admin',dispute,'refund-partial',{amount},'Reason')).toBe('amount')
  expect(adminActionError('admin',dispute,'refund-partial',{amount:.01},'Reason')).toBe('')
  expect(adminActionError('admin',{...dispute,refundedAmount:undefined},'refund-full',{amount:100},'Reason')).toBe('payment')
  expect(adminActionError('admin',{...dispute,refundedAmount:-1},'refund-full',{amount:101},'Reason')).toBe('payment')
  expect(adminActionError('admin',{...dispute,orderId:undefined},'refund-full',{amount:75},'Reason')).toBe('state')
 })
 it('prevents simultaneous competing resolutions and permits a cancelled request to be retried',()=>{
  expect(adminActionError('admin',dispute,'refund-full',{amount:75},'Reason',[request])).toBe('duplicate')
  expect(adminActionError('admin',dispute,'dispute-reject',{},'Reason',[request])).toBe('duplicate')
  const cancelled=cancelAdminRequest({...emptyAdminWorkspace(),requests:[request]},'r')
  expect(adminActionError('admin',dispute,'refund-full',{amount:75},'Reason',cancelled.requests)).toBe('')
 })
 it('guards moderator boundaries independently from hidden tabs',()=>{
  expect(adminActionError('moderator',dispute,'refund-full',{amount:75},'Reason')).toBe('permission')
  expect(adminActionError('moderator',{id:'u',kind:'user',name:'User',status:'active'},'block',{},'Reason')).toBe('permission')
  expect(adminActionError('moderator',{id:'modules',kind:'user',name:'Modules'},'config',{},'Reason')).toBe('permission')
  expect(adminActionError('moderator',{id:'m',kind:'moderation',name:'Author'},'moderation-reject',{},'Reason')).toBe('')
 })
 it('requires stage-one approval and provider evidence, never invents KYC approval',()=>{
  const v:AdminRecord={id:'v',kind:'verification',name:'Practitioner',stage1:'pending',kyc:'none'}
  expect(adminActionError('admin',v,'kyc-request',{},'Reason')).toBe('stage')
  expect(adminActionError('admin',{...v,stage1:'approved'},'kyc-request',{},'Reason')).toBe('')
  expect(adminActionError('admin',{...v,stage1:'approved',kyc:'pending'},'kyc-pass',{},'Reason')).toBe('evidence')
  expect(adminActionError('admin',{...v,stage1:'approved',kyc:'pending'},'kyc-pass',{vendorReference:'result-id'},'Reason')).toBe('')
  expect(v.stage1).toBe('pending')
 })
 it('snapshots pending payload and preserves original records and request history',()=>{
  const input={...request,payload:{nested:{fee:4}}};const state=addAdminRequest(emptyAdminWorkspace(),input);input.payload.nested.fee=9
  expect(state.requests[0].payload).toEqual({nested:{fee:4}})
  expect(state.requests[0].status).toBe('prepared');expect(dispute.status).toBe('open')
  const next=cancelAdminRequest(state,'r');expect(state.requests[0].status).toBe('prepared');expect(next.requests[0].status).toBe('cancelled')
 })
 it('does not infer user access state and restricts unsafe evidence links',()=>{
  expect(adminActionError('admin',{id:'u',kind:'user',name:'User'},'block',{},'Reason')).toBe('state')
  expect(safeAdminUrl('javascript:alert(1)')).toBe('');expect(safeAdminUrl('https://user:password@host.test')).toBe('')
  expect(safeAdminUrl('https://example.org/result')).toBe('https://example.org/result')
 })
})
describe('admin commercial configuration',()=>{
 it('validates limits, percentages, promo dates and template variables',()=>{
  const plan={name:'Pro',price:1000,priceYear:10000,fee:4,seats:1,bookings:0,aiLimit:0,automations:0}
  expect(configError('plan:p',plan)).toBe('');expect(configError('plan:p',{...plan,seats:0})).toBe('plan');expect(configError('plan:p',{...plan,fee:101})).toBe('plan')
  expect(configError('payout',{fee:4,minPayout:1000,promo:true,title:'Promo',promoFee:0,from:'2026-10-20',to:'2026-10-19'})).toBe('payout')
  expect(configError('referral',{model:'pct',reward:101,invitee:'none',inviteeVal:0,hold:14,limit:0})).toBe('referral')
  expect(configError('template:appointment',{body:'Hello {name}, {date} {time}',channel:'email'})).toBe('')
  expect(configError('template:appointment',{body:'Hello {password}',channel:'email'})).toBe('template')
 })
 it('calculates economics without assuming a universal base fee',()=>{
  const result=planEconomics({price:1000,priceYear:10000,fee:4},4000,8)
  expect(result.commission).toBe(1280);expect(result.practitioner).toBe(29720);expect(result.breakEven).toBeNull()
  expect(planEconomics({price:1000,fee:4},4000,8,8).breakEven).toBe(7)
 })
})

import {effectiveAdminPayout,disputeMessageRecipient} from './admin-workflows'
describe('payout fee precedence from original terms',()=>{
 const base={fee:4,minPayout:500,instant:false,promo:false,promoFee:0,promoInstant:true,from:'2026-10-01',to:'2026-10-31'}
 it('uses explicit base or individual terms and does not invent missing financial fields',()=>{
  expect(effectiveAdminPayout(base,undefined,'2026-10-16')).toMatchObject({fee:4,source:'base',minimum:500,instant:false})
  expect(effectiveAdminPayout(base,{enabled:true,fee:2,minPayout:1000,instant:true},'2026-10-16')).toMatchObject({fee:2,source:'personal',minimum:1000,instant:true})
  expect(effectiveAdminPayout(base,{enabled:false,fee:2},'2026-10-16').source).toBe('base')
  expect(effectiveAdminPayout(undefined,undefined,'2026-10-16')).toMatchObject({fee:null,source:'unknown',minimum:null,instant:null})
  // The original contract replaces the base fee with personal terms, rather than always taking min(base, personal).
  expect(effectiveAdminPayout(base,{fee:6},'2026-10-16')).toMatchObject({fee:6,source:'personal'})
 })
 it('applies a cheaper or equal active promotion without losing personal minimum and instant payout',()=>{
  const override={fee:2,instant:true,minPayout:1000}
  expect(effectiveAdminPayout({...base,promo:true,promoFee:1,promoInstant:false},override,'2026-10-16')).toMatchObject({fee:1,source:'personal+promo',minimum:1000,instant:true,promoApplied:true})
  expect(effectiveAdminPayout({...base,promo:true,promoFee:2},override,'2026-10-16')).toMatchObject({fee:2,source:'personal+promo'})
  expect(effectiveAdminPayout({...base,promo:true,promoFee:3},override,'2026-10-16')).toMatchObject({fee:2,source:'personal',promoApplied:false})
  expect(effectiveAdminPayout({...base,promo:true,promoFee:0},undefined,'2026-10-16')).toMatchObject({fee:0,source:'promo',instant:true})
 })
 it('honors start/end boundaries and refuses to compare against unknown fees',()=>{
  const promotion={...base,promo:true}
  expect(effectiveAdminPayout(promotion,undefined,'2026-09-30')).toMatchObject({fee:4,promoState:'upcoming'})
  expect(effectiveAdminPayout(promotion,undefined,'2026-10-01').source).toBe('promo')
  expect(effectiveAdminPayout(promotion,undefined,'2026-10-31').source).toBe('promo')
  expect(effectiveAdminPayout(promotion,undefined,'2026-11-01')).toMatchObject({fee:4,promoState:'expired'})
  expect(effectiveAdminPayout({...promotion,to:'2026-09-01'},undefined,'2026-10-16').promoState).toBe('invalid')
  expect(effectiveAdminPayout({promo:true,promoFee:1},undefined,'2026-10-16')).toMatchObject({fee:null,source:'unknown',promoApplied:false})
 })
})
describe('dispute message recipient is explicit and bound to an account',()=>{
 const item:AdminRecord={...dispute,client:{id:'client-1',name:'Марина Иванова'},practitioner:{id:'astro-1',name:'Анна Соколова'}}
 const clientPayload={recipientSide:'client',recipientId:'client-1',body:'Question',channel:'inapp',subject:'Order question'}
 const practitionerPayload={...clientPayload,recipientSide:'practitioner',recipientId:'astro-1'}
 it('requires the selected side and real supplied account, accepts original in-app channel',()=>{
  expect(adminActionError('admin',item,'message',clientPayload,'Contact client')).toBe('')
  expect(disputeMessageRecipient(item,practitionerPayload)?.name).toBe('Анна Соколова')
  expect(adminActionError('admin',item,'message',{...clientPayload,recipientId:'astro-1'},'Reason')).toBe('recipient')
  expect(adminActionError('admin',dispute,'message',clientPayload,'Reason')).toBe('recipient')
 })
 it('keeps independent requests for both parties while blocking duplicates to the same account',()=>{
  const pending:AdminRequest={...request,kind:'message',payload:clientPayload}
  expect(adminActionError('admin',item,'message',clientPayload,'Reason',[pending])).toBe('duplicate')
  expect(adminActionError('admin',item,'message',practitionerPayload,'Reason',[pending])).toBe('')
  expect(item.status).toBe('open')
 })
})
