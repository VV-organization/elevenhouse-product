import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {portalSections,portalOverviewContent,PortalOverview} from './portal-overview'
import {iconAssets} from '../components/iconAssets'
import type {PortalContentData} from './portal-content-model'
const data:PortalContentData={clientId:'client',specialistId:'specialist',posts:[],materials:['accessible','revoked','expired','unshared'].map(id=>({id,title:id,kind:'text',createdAt:'2026-10-01'})),access:[{id:'1',target:'material',contentId:'accessible',status:'granted'},{id:'2',target:'material',contentId:'revoked',status:'revoked'},{id:'3',target:'material',contentId:'expired',status:'granted',expiresAt:'2026-10-02'}]}
describe('client overview',()=>{
 it('never previews restricted or foreign materials',()=>{
  const now=new Date('2026-10-20')
  expect(portalOverviewContent(data,'client','specialist',now).map(m=>m.id)).toEqual(['accessible'])
  expect(portalOverviewContent(data,'other','specialist',now)).toEqual([])
  expect(portalOverviewContent(data,'client','other',now)).toEqual([])
 })
 it('retains every existing portal section with a real icon',()=>{
  expect(portalSections().map(s=>s.id)).toEqual(['home','bookings','messages','materials','orders','billing','feed','profile'])
  for(const section of portalSections())expect(iconAssets[section.icon]).toBeDefined()
 })
 it('does not invent appointments, messages or content for an empty client',()=>{
  const noop=()=>{}
  const html=renderToStaticMarkup(<PortalOverview name="Анна" astrologer="Специалист" timeZone="UTC" orders={[]} specialistId="specialist" onNavigate={noop} onBook={noop} onMeeting={noop} onMaterial={noop} onPrepare={noop}/> )
  expect(html).toContain('Выбрать консультацию')
  expect(html).not.toContain('Открыть встречу')
  expect(html).not.toContain('Последнее сообщение')
  expect(html).toContain('Мой дневник')
 })
})
