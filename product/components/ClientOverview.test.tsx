import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {ClientOverview} from './ClientOverview'
import {createExamplePractice,createEmptyPractice} from '../state/model'
import {MethodCalculationSource} from './SavedCalculationHistory'
import {ModuleSeedContext} from '../modules/ModuleKit'
import {createMemberPractice} from '../state/memberCore'
describe('client overview data integrity',()=>{
 it('shows a chart example only for its matching example client',()=>{
  const practice=createExamplePractice()
  const render=(index:number)=>renderToStaticMarkup(<ClientOverview practice={practice} client={practice.clients[index]} onMethod={()=>{}}/>)
  expect(render(0)).toContain('Натальная карта')
  expect(render(0)).not.toContain('Пример натальной карты')
  expect(render(1)).not.toContain('co-chart-preview')
 })
 it('does not turn example birth details into a saved chart in a live practice',()=>{
  const example=createExamplePractice(),practice={...createEmptyPractice('Анна'),clients:example.clients}
  const html=renderToStaticMarkup(<ClientOverview practice={practice} client={practice.clients[0]} onMethod={()=>{}}/>)
  expect(html).not.toContain('co-chart-preview')
  expect(html).toContain('Нумерология')
  expect(html).toContain('Дизайн человека')
 })
 it('reads the saved result independently of current birth fields',()=>{
  const key='marina:numbers:portrait:2026::record'
  const html=renderToStaticMarkup(<MethodCalculationSource records={{[key]:{at:'2026-10-19T10:00:00Z',result:{name:'Марина',life:9}}}} clientId="marina" recordKey={key} onClose={()=>{}}/>)
  expect(html).toContain('Жизненный путь')
  expect(html).toContain('<strong>9</strong>')
  expect(html).toContain('Скачать сохранённые данные')
 })
 it('previews a saved astrology result and keeps its archive compact',()=>{
  const practice=createMemberPractice(),client=practice.clients.find(c=>c.id==='olga')!
  const html=renderToStaticMarkup(<ModuleSeedContext.Provider value="member"><ClientOverview practice={practice} client={client} onMethod={()=>{}}/></ModuleSeedContext.Provider>)
  expect(html).toContain('co-chart-preview')
  expect(html).toContain('aw-dial--compact')
  expect(html).toContain('Все расчёты · 4')
  const archive=html.split('class="co-saved"')[1].split('class="co-methods"')[0]
  expect(archive.match(/<small>/g)).toHaveLength(3)
  for(const name of ['Астрология','Нумерология','Матрица судьбы','Дизайн человека'])expect(html).toContain(name)
 })
 it('does not borrow another client’s saved preview in a populated account',()=>{
  const practice=createMemberPractice(),client={...practice.clients[0],id:'new-client'}
  const html=renderToStaticMarkup(<ModuleSeedContext.Provider value="member"><ClientOverview practice={practice} client={client} onMethod={()=>{}}/></ModuleSeedContext.Provider>)
  expect(html).not.toContain('co-chart-preview')
  expect(html).not.toContain('class="co-saved"')
  expect(html).toContain('Дизайн человека')
 })
})
