import {describe,it,expect} from 'vitest'
import {showcaseSection,SHOWCASE_VIEWS,showcaseView,frameUrl,showcaseScope,showcaseStorageKeys} from './showcase-model'
describe('presentation routing and storage isolation',()=>{
 it('provides every requested view and a safe default',()=>{
  expect(SHOWCASE_VIEWS.map(v=>v.id)).toEqual(['register','register-client','onboarding','workspace','mobile','client','page','admin'])
  expect(showcaseView('https://evil.example')).toBe('workspace')
  expect(showcaseView('mobile')).toBe('mobile')
 })
 it('keeps the deployed subpath and prevents recursive shells or auth leaks',()=>{
  const url=new URL(frameUrl('https://example.test/elevenhouse-product/?demo=1&mode=register&view=admin#finance','mobile'))
  expect(url.pathname).toBe('/elevenhouse-product/')
  expect(url.searchParams.get('demoFrame')).toBe('mobile')
  expect(url.searchParams.has('demo')).toBe(false)
  expect(url.searchParams.has('mode')).toBe(false)
  expect(url.hash).toBe('#dashboard')
 })
 it('resets only the selected demo namespace, never real or other demo accounts',()=>{
  const scope=showcaseScope('onboarding')
  const keys=[`eh-product-v2-${scope}-learning-v1`,`eh-showcase:onboarding:practice`,'eh-product-v1-session','eh-product-v1-member-anna','eh-product-v2-member-anna-learning-v1','eh-product-v2-showcase-workspace-services','eh-product-v2-showcase-onboarding-other-learning']
  expect(showcaseStorageKeys(keys,'onboarding')).toEqual(keys.slice(0,2))
 })
 it('allows only contextual order, message and sign-in destinations',()=>{
  expect(showcaseSection('client','orders')).toBe('orders')
  expect(showcaseSection('client','messages')).toBe('messages')
  expect(showcaseSection('register-client','login')).toBe('login')
  expect(showcaseSection('client','login')).toBeUndefined()
  expect(showcaseSection('page','orders')).toBeUndefined()
  expect(showcaseSection('client','https://evil.example')).toBeUndefined()
  expect(new URL(frameUrl('https://example.test/product/','client',undefined,'orders')).searchParams.get('section')).toBe('orders')
 })
 it('carries a public-page service only to the client frame',()=>{
  expect(new URL(frameUrl('https://example.test/product/','client','natal')).searchParams.get('service')).toBe('natal')
  expect(new URL(frameUrl('https://example.test/product/','admin','natal')).searchParams.has('service')).toBe(false)
 })
})
