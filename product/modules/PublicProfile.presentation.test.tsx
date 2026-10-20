import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {PublicProfilePreview} from './PublicProfile'
import {newPublicProfile} from '../state/public-profile'
import {commerceDefaults} from '../state/commerce-model'
import {type Service} from './ServicesFinance'

const service=(id:string,sale:'once'|'free'|'pack'|'subscription'='once'):Service=>({id,name:id,description:'Actual service description',price:4900,duration:60,status:'available',includes:['Summary'],commerce:{...commerceDefaults(4900),sale}})
describe('public profile presentation',()=>{
 it('shows a real identity fallback and groups all supported sale types',()=>{
  const html=renderToStaticMarkup(<PublicProfilePreview profile={newPublicProfile('Анна Соколова').draft} services={['once','free','pack','subscription'].map(sale=>service(sale,sale as 'once'))} onBookService={()=>{}}/>)
  expect(html).toContain('Анна Соколова');expect(html).toContain('АС');expect(html).toContain('Выбрать консультацию')
  for(const text of ['Индивидуальные консультации','Бесплатно','Пакеты встреч','Регулярное сопровождение','Actual service description','60 мин'])expect(html).toContain(text)
  expect(html).not.toContain('верифицирован');expect(html).not.toContain('rating')
 })
 it('removes the services CTA and catalogue when the owner hides the section',()=>{
  const profile={...newPublicProfile('Anna').draft,hiddenBlocks:['services']}
  const html=renderToStaticMarkup(<PublicProfilePreview profile={profile} services={[service('Hidden consultation')]} onBookService={()=>{}}/>)
  expect(html).not.toContain('Выбрать консультацию');expect(html).not.toContain('Hidden consultation')
 })
 it('keeps custom ordering, real links, and excludes unavailable services',()=>{
  const profile={...newPublicProfile('Anna').draft,bio:'Biography text',order:['links','services','about'],links:[{id:'safe',label:'Real contact',url:'https://example.com'},{id:'unsafe',label:'Unsafe contact',url:'javascript:alert(1)'}],hiddenServices:['excluded']}
  const html=renderToStaticMarkup(<PublicProfilePreview profile={profile} services={[service('Available'),service('excluded'),{...service('Draft'),status:'draft'},{...service('Archived'),archived:true}]}/>)
  expect(html.indexOf('Real contact')).toBeLessThan(html.indexOf('Available'));expect(html.indexOf('Available')).toBeLessThan(html.indexOf('Biography text'))
  expect(html).toContain('rel="noopener noreferrer"');expect(html).not.toContain('Unsafe contact')
  for(const text of ['excluded','Draft','Archived'])expect(html).not.toContain(text)
  expect(html).toContain('Подробнее о формате');expect(html).not.toContain('>Записаться<')
 })
 it('does not invent a consultation when the catalogue is empty',()=>{
  const html=renderToStaticMarkup(<PublicProfilePreview profile={newPublicProfile('Anna').draft} services={[]}/>)
  expect(html).not.toContain('Выбрать консультацию');expect(html).not.toContain('eh-public-service-group')
 })
})
