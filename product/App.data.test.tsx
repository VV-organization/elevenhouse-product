import {afterEach,describe,it,expect,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {App} from './App'
import {setLocale} from './i18n'
import {createExamplePractice} from './state/model'
function surface(name:string){setLocale('ru');vi.stubGlobal('window',{location:new URL(`https://example.test/?surface=${name}`)});vi.stubGlobal('localStorage',{getItem:()=>null,setItem:()=>{}})}
afterEach(()=>vi.unstubAllGlobals())
describe('supplied product data at application entry',()=>{
 it('renders supplied administrator records instead of replacing them with legacy empty records',()=>{
  surface('admin');const html=renderToStaticMarkup(<App data={{admin:{role:'moderator',records:[{id:'real-case',kind:'moderation',name:'Владелец',title:'Проверяемый материал',status:'pending',contentKind:'post'}]}}}/>);
  expect(html).toContain('Проверяемый материал');expect(html).not.toContain('Сохранённые обращения доступны');expect(html).not.toContain('Тарифы и выплаты')
 })
 it('routes supplied content statistics through the workspace and section boundary',()=>{
  surface('workspace');vi.stubGlobal('window',{location:new URL('https://example.test/#content')});const practice=createExamplePractice();
  vi.stubGlobal('localStorage',{getItem:(key:string)=>key==='eh-product-v1-session'?'example':key==='eh-product-v1-example'?JSON.stringify(practice):null,setItem:()=>{}});
  const html=renderToStaticMarkup(<App data={{communication:{content:{subscription:{subscribers:147,mrr:12345,currency:'RUB',asOf:'2026-10-16'}}}}}/>);
  expect(html).toContain('MRR: 12345 RUB');expect(html).toContain('147')
 })
 it('does not fall back to example practice when an explicit client context lacks its practice',()=>{
  surface('client');const html=renderToStaticMarkup(<App data={{portal:{clientId:'olga'}}}/>);expect(html).toContain('Данные выбранного специалиста ещё не загружены.');expect(html).not.toContain('Услуги астролога')
 })
 it('exposes supplied multiple astrologers in the client surface',()=>{
  surface('client');const html=renderToStaticMarkup(<App data={{portal:{practice:createExamplePractice(),clientId:'marina',astrologers:[{id:'a',name:'Специалист А'},{id:'b',name:'Специалист Б'}],activeAstrologerId:'b',onSelectAstrologer:()=>{}}}}/>);
  expect(html).toContain('Специалист А');expect(html).toContain('Специалист Б');expect(html).toMatch(/<option[^>]*value="b"[^>]*selected=""[^>]*>Специалист Б<\/option>/)
 })
})
