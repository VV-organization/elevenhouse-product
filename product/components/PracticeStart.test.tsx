import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {PracticeStart} from './PracticeStart'
import {setLocale} from '../i18n'
describe('shared first-task screen',()=>{
 it('retains both starting tasks and the independent exploration path',()=>{
  setLocale('ru');const html=renderToStaticMarkup(<PracticeStart name="Анна Соколова" onBegin={()=>{}} onLogout={()=>{}}/>)
  for(const text of ['С чего начнём','Анна','Записать клиента на консультацию','Подготовить расчёт','Записать первого клиента','Начну самостоятельно'])expect(html).toContain(text)
 })
})
