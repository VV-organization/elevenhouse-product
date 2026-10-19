import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {FlowGraph} from './FlowGraph'
import {setLocale} from '../i18n'
import type {Flow} from '../state/communication-workflows'
const flow:Flow={id:'test',name:'Test',kind:'custom',text:'',status:'paused',trigger:'manual',steps:[{id:'a',kind:'condition',value:'paid',branches:{yes:'b',no:null}},{id:'b',kind:'approval',value:'',next:null}]}
describe('accessible workflow canvas',()=>{
 it('exposes card actions, branch labels, zoom and chosen step',()=>{
  setLocale('ru')
  const html=renderToStaticMarkup(<FlowGraph flow={flow} selected="a" onSelect={()=>{}} label={id=>id==='a'?'Оплата получена':'Согласовать'} triggerLabel="Вручную" trace={null}/>)
  expect(html).toContain('aria-label="Схема сценария"')
  expect(html).toContain('aria-pressed="true"')
  expect(html).toContain('Настроить: Оплата получена')
  expect(html).toContain('Увеличить схему')
  expect(html).toContain('Уместить')
  expect(html).toContain('Да');expect(html).toContain('Нет')
  expect(html).toContain('Завершение')
  expect(html).not.toContain('eh-flow-pulse')
 })
 it('shows the last visit when a bounded loop stops',()=>{
  setLocale('ru')
  const html=renderToStaticMarkup(<FlowGraph flow={flow} selected={null} onSelect={()=>{}} label={id=>id} triggerLabel="Вручную" trace={[{stepId:'a',status:'pass',text:'',nextId:'a',conditionResult:false,visit:1},{stepId:'a',status:'limit',text:'',visit:4}]}/>)
  expect(html).toContain('Проверка остановлена')
  expect(html).toContain('is-held')
 })

})
