import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {FlowPalette,FlowCalculationFields,FlowFields} from './communication-flow-fields'
import {flowCalculationDefaults,actionFields,fieldDefaults} from '../state/flow-palette'
import {setLocale} from '../i18n'
describe('restored workflow configuration UI',()=>{
 it('exposes the complete original action groups and specific actions',()=>{
  setLocale('ru');const html=renderToStaticMarkup(<FlowPalette onAdd={()=>{}}/>);
  for(const label of ['Движок карт','Запросить оплату','Webhook / интеграция','A/B-разделение','Живая видеосессия','AI-ответ клиенту','Матрица судьбы'])expect(html).toContain(label)
 })
 it('exposes return, comparison, location and Vedic fields for the selected calculation',()=>{
  setLocale('ru');const render=(type:string)=>renderToStaticMarkup(<FlowCalculationFields value={flowCalculationDefaults(type)} onChange={()=>{}}/>);
  expect(render('return')).toContain('Вид возвращения');expect(render('return')).toContain('Лунар');expect(render('synastry')).toContain('Вторая карта');expect(render('acg')).toContain('Города / регионы');expect(render('vedic')).toContain('Аянамша');expect(render('vedic')).toContain('Фаган-Брэдли');expect(render('natal')).toContain('Куда передать результат')
 })
 it('offers webhook payload and delivery format fields in English',()=>{
  setLocale('en');const html=renderToStaticMarkup(<><FlowFields fields={actionFields('webhook')} value={fieldDefaults(actionFields('webhook'))} onChange={()=>{}}/><FlowFields fields={actionFields('deliver')} onChange={()=>{}}/></>);expect(html).toContain('JSON request body');expect(html).toContain('Video + PDF');setLocale('ru')
 })
})
