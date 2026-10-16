import {describe,it,expect} from 'vitest'
import {billingData,prepareSubscriptionChange,type PortalBillingData} from './portal-billing-model'
const data:PortalBillingData={clientId:'marina',specialistId:'a',subscriptions:[{id:'sub',serviceId:'service',title:'Support',amount:990,period:'month',status:'active',autoRenew:true,renewsAt:'2026-11-01',plans:[{id:'year',title:'Annual',amount:9990,period:'year'}]}]}
describe('supplied subscription management',()=>{
 it('never exposes another client or specialist billing',()=>{
  expect(billingData(data,'other','a')).toBeUndefined();expect(billingData(data,'marina','other')).toBeUndefined();expect(billingData(data,'marina','a')).toBe(data)
 })
 it('prepares an explicit change without changing actual subscription or claiming payment',()=>{
  const sub=structuredClone(data.subscriptions[0]),request=prepareSubscriptionChange(sub,'change-plan','year',[],'r','now')
  expect(request).toMatchObject({subscriptionId:'sub',action:'change-plan',plan:{id:'year',amount:9990},currentTerms:{amount:990,period:'month',autoRenew:true},status:'prepared'})
  sub.plans![0].amount=100
  expect(request.plan?.amount).toBe(9990);expect(sub.status).toBe('active');expect(request).not.toHaveProperty('paid')
 })
 it('blocks impossible state changes, unknown plans and duplicate pending requests',()=>{
  const sub=data.subscriptions[0],request=prepareSubscriptionChange(sub,'pause',undefined,[],'r','now')
  expect(()=>prepareSubscriptionChange(sub,'cancel',undefined,[request],'r2','now')).toThrow('pending')
  expect(()=>prepareSubscriptionChange(sub,'change-plan','unknown',[],'r','now')).toThrow('plan')
  expect(()=>prepareSubscriptionChange({...sub,status:'cancelled'},'pause',undefined,[],'r','now')).toThrow('state')
  expect(()=>prepareSubscriptionChange(sub,'enable-renewal',undefined,[],'r','now')).toThrow('state')
 })
})
