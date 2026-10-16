import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {CalculationDeliveryActions,CalculationAttachmentView} from './CalculationDeliveryActions'
import {createExamplePractice} from '../state/model'
import {calculationAttachment} from '../state/calculationDelivery'
describe('calculation delivery presentation',()=>{
 it('offers explicit print and local sharing without claiming generated AI or sent files',()=>{const practice=createExamplePractice();const html=renderToStaticMarkup(<CalculationDeliveryActions practice={practice} clientId={practice.clients[0].id} title="Нумерология" result={{life:7}}><p>Жизненный путь: 7</p></CalculationDeliveryActions>);expect(html).toContain('Печать / PDF');expect(html).toContain('Добавить в дневник клиента');expect(html).toContain('Запросить AI-черновик');expect(html).not.toContain('сгенерировано AI');expect(html).not.toContain('PDF отправлен')})
 it('renders the shared frozen values and reviewed interpretation without private client notes',()=>{const snapshot=calculationAttachment('Расчёт',{name:'Анна',life:7,partner:{name:'Павел',life:4}},'Обсудили следующий шаг.','2026-10-16T10:00:00Z');const html=renderToStaticMarkup(<CalculationAttachmentView attachment={snapshot}/>);expect(html).toContain('Жизненный путь');expect(html).toContain('Анна');expect(html).toContain('Павел');expect(html).toContain('Обсудили следующий шаг.');expect(html).toContain('Скачать данные расчёта');expect(html).not.toContain('private-notes')})
})
