import {afterEach,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {setLocale} from '../i18n'
import {englishPsyCells,englishPsyLines,englishNumberMeanings,englishArcana} from './calculationEnglishText'
import {originalPsyCells,originalPsyLines,originalNumberMeanings,originalArcana} from './calculationOriginalText'
import {ReferenceCalculations} from '../components/ReferenceCalculations'
import {MethodCalculations} from '../components/MethodCalculations'
import {CalculationDeliveryActions} from '../components/CalculationDeliveryActions'
import {createExamplePractice} from './model'
import {initialMaterials,saveCalculationMaterial} from './calculationMaterials'
afterEach(()=>{vi.unstubAllGlobals();setLocale('ru')})
describe('complete English interpretations',()=>{
 it('provides every original number, arcana, cell level and line without Russian fallback',()=>{
  expect(Object.keys(englishNumberMeanings)).toEqual(Object.keys(originalNumberMeanings))
  expect(Object.keys(englishArcana)).toEqual(Object.keys(originalArcana))
  expect(englishPsyLines).toHaveLength(originalPsyLines.length)
  for(const key of Object.keys(originalPsyCells).map(Number))expect(englishPsyCells[key].levels).toHaveLength(originalPsyCells[key].levels.length)
  expect(JSON.stringify([englishPsyCells,englishPsyLines,englishNumberMeanings,englishArcana])).not.toMatch(/[А-Яа-яЁё]/)
 })
 it('renders the full English reference including the original growth and relationship themes',()=>{
  setLocale('en');const html=renderToStaticMarkup(<ReferenceCalculations example={false}/>)
  expect(html).toContain('Learns patience and how to follow through.')
  expect(html).toContain('open enemies')
  expect(html).toContain('projections and learns balance')
  expect(html).not.toContain('Discussion theme')
  expect(html).not.toMatch(/[А-Яа-яЁё]/)
 })
 it.each(['numbers','matrix'] as const)('renders %s full details in English',method=>{
  setLocale('en');const practice={...createExamplePractice(),clients:[]}
  const html=renderToStaticMarkup(<MethodCalculations method={method} date="1990-05-12" name="Anna" practice={practice}/>)
  expect(html).toContain(method==='numbers'?'Full interpretation':'Full arcana interpretation')
  expect(html).not.toContain('· Russian')
  expect(html).not.toMatch(/[А-Яа-яЁё]/)
 })
})
describe('calculation materials',()=>{
 it('preserves existing texts, updates the same calculation, and survives persistence',()=>{
  const seed=initialMaterials(true),before=structuredClone(seed)
  const saved=saveCalculationMaterial(seed,'calculation:one','Natal chart','  Reviewed text  ','2026-10-16T10:00:00Z')
  const reloaded=JSON.parse(JSON.stringify(saved))
  const updated=saveCalculationMaterial(reloaded,'calculation:one','Natal chart','Revised text','2026-10-16T11:00:00Z')
  expect(seed).toEqual(before);expect(updated.slice(0,seed.length)).toEqual(seed)
  expect(updated).toHaveLength(seed.length+1)
  expect(updated.at(-1)).toMatchObject({text:'Revised text',category:'Трактовки'})
  expect(saveCalculationMaterial(updated,'other','Empty','  ','now')).toBe(updated)
 })
 it('exposes private material saving separately from shared journal delivery',()=>{
  const html=renderToStaticMarkup(<CalculationDeliveryActions practice={createExamplePractice()} title="Chart" result={{life:7}}><p>7</p></CalculationDeliveryActions>)
  expect(html).toContain('Сохранить в мои материалы');expect(html).toContain('Добавить в дневник клиента')
 })
})
