import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {ClientOverview} from './ClientOverview'
import {createExamplePractice,createEmptyPractice} from '../state/model'
import {MethodCalculationSource} from './SavedCalculationHistory'
describe('client overview data integrity',()=>{
 it('shows a chart example only for its matching example client',()=>{
  const practice=createExamplePractice()
  const render=(index:number)=>renderToStaticMarkup(<ClientOverview practice={practice} client={practice.clients[index]} onMethod={()=>{}}/>)
  expect(render(0)).toContain('Пример натальной карты')
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
})
