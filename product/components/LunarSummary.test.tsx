import {afterEach,describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {LunarSummary} from './LunarSummary'
import {setLocale} from '../i18n'

afterEach(()=>setLocale('ru'))
const moon={phase:'Растущая Луна',sign:'Телец',source:'Демонстрационный шаблон'}
describe('lunar information provenance',()=>{
 it('keeps exact measurements without exposing internal preview annotations',()=>{
  const html=renderToStaticMarkup(<LunarSummary moon={{...moon,illumination:64}} compact/>)
  for(const text of ['64','освещено','Телец'])expect(html).toContain(text)
  expect(html).not.toContain('Демонстрационный шаблон')
 })
 it('does not invent illumination when it is absent or invalid',()=>{
  for(const illumination of [undefined,NaN,-1,101]){
   const html=renderToStaticMarkup(<LunarSummary moon={{...moon,illumination}}/>)
   expect(html).not.toContain('освещено')
   expect(html).toContain('Растущая Луна')
  }
 })
 it('distinguishes a confirmed new moon from missing data',()=>{
  const html=renderToStaticMarkup(<LunarSummary moon={{...moon,phase:'Новолуние',illumination:0}}/>)
  expect(html).toContain('0%')
  expect(html).toContain('освещено')
  expect(renderToStaticMarkup(<LunarSummary/>)).not.toContain('освещено')
 })
 it('retains supplied names and source in the English interface',()=>{
  setLocale('en')
  const html=renderToStaticMarkup(<LunarSummary moon={{phase:'Waning Moon',sign:'Taurus',source:'Observatory',illumination:25}}/>)
  for(const text of ['Waning Moon','Taurus','Source','Observatory','illuminated'])expect(html).toContain(text)
 })
})
