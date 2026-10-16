import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {SettingsPlanCatalog} from './settings-plan-catalog'
describe('settings plan catalog',()=>{
 it('keeps original selectable plans available without billing data or a fabricated active subscription',()=>{
  const html=renderToStaticMarkup(<SettingsPlanCatalog cycle="month" onRequest={()=>{}}/>);
  for(const name of ['Старт','Pro','Studio'])expect(html).toContain(name)
  expect(html.match(/Подготовить переход/g)).toHaveLength(3)
  expect(html).toContain('8%');expect(html).toContain('4%');expect(html).toContain('2%')
  expect(html).toContain('Исходные условия');expect(html).not.toContain('Активен')
 })
 it('uses supplied service plans exclusively and preserves explicit empty availability',()=>{
  const html=renderToStaticMarkup(<SettingsPlanCatalog cycle="year" billing={{plans:[{id:'custom',name:'Рабочий тариф',monthly:100,annual:1000,fee:3,features:['Особая возможность']}],invoices:[]}} onRequest={()=>{}}/>);
  expect(html).toContain('Рабочий тариф');expect(html).toContain('Особая возможность');expect(html).not.toContain('Studio');expect(html).not.toContain('Исходные условия')
  const empty=renderToStaticMarkup(<SettingsPlanCatalog cycle="month" billing={{plans:[],invoices:[]}} onRequest={()=>{}}/>);expect(empty).not.toContain('Подготовить переход')
 })
 it('identifies the active plan while still allowing a different billing period',()=>{
  const billing={plans:[{id:'pro',name:'Pro',monthly:990,annual:9900,fee:4,features:[]}],currentPlanId:'pro',cycle:'month' as const,invoices:[]};
  const current=renderToStaticMarkup(<SettingsPlanCatalog cycle="month" billing={billing} onRequest={()=>{}}/>);expect(current).toContain('Текущий тариф');expect(current).toContain('disabled');
  const annual=renderToStaticMarkup(<SettingsPlanCatalog cycle="year" billing={billing} onRequest={()=>{}}/>);expect(annual).toContain('Подготовить переход');expect(annual).not.toContain('disabled');
 })

})
