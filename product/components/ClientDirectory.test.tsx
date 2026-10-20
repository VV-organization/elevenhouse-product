import {afterEach,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {ClientDirectory} from './ClientDirectory'
import {createExamplePractice} from '../state/model'
import {setLocale} from '../i18n'

afterEach(()=>vi.unstubAllGlobals())
describe('client directory pages',()=>{
 it('keeps matching clients beyond the first page reachable and filters before pagination',()=>{
  setLocale('ru')
  let query=''
  vi.stubGlobal('localStorage',{getItem:(key:string)=>key.endsWith('-client-directory-filters')?JSON.stringify({query,stage:'all'}):null})
  const practice=createExamplePractice(),sample=practice.clients[0]
  practice.clients=Array.from({length:13},(_,i)=>({...sample,id:`client-${i}`,name:`Клиент ${String(i+1).padStart(2,'0')}`}))
  const render=()=>renderToStaticMarkup(<ClientDirectory practice={practice} onChange={()=>{}} onOpen={()=>{}} onNew={()=>{}}/>)
  const initial=render()
  expect(initial.match(/class="cd-person-button"/g)).toHaveLength(8)
  expect(initial).toContain('Следующая страница клиентов')
  expect(initial).not.toContain('Посмотреть клиента: Клиент 13')
  query='Клиент 13'
  const filtered=render()
  expect(filtered.match(/class="cd-person-button"/g)).toHaveLength(1)
  expect(filtered).toContain('Посмотреть клиента: Клиент 13')
  expect(filtered).toContain('Расчёты: Клиент 13')
  expect(filtered).toContain('Переписка: Клиент 13')
 })
})
