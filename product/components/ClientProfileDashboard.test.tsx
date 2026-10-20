import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {ClientProfileDashboard} from './ClientProfileDashboard'
import {createExamplePractice} from '../state/model'

describe('client profile overview',()=>{
 it('keeps personal data, activity and contextual actions in the composed overview',()=>{
  const practice=createExamplePractice(),client={...practice.clients[0],phone:'+7 (000) 000-00-01',email:'profile@example.test',telegram:'@profile_qa',tags:['Сопровождение'],notes:'Личная заметка для проверки',request:'Запрос клиента для проверки'}
  practice.appointments=[{...practice.appointments[0],id:'profile-completed',clientId:client.id,date:'2026-10-01',status:'completed',outcome:'Сохранённый итог встречи'}, {...practice.appointments[0],id:'profile-upcoming',clientId:client.id,date:'2026-10-25'}, {...practice.appointments[0],id:'other-client',clientId:'other',status:'completed'}]
  const noop=()=>{}
  const html=renderToStaticMarkup(<ClientProfileDashboard practice={practice} client={client} today="2026-10-20" onMethod={noop} onEdit={noop} onBirth={noop} onNotes={noop} onPayments={noop} onMessage={noop} onNew={noop} onMeeting={noop} onOrder={noop}/>)
  for(const text of [client.name,client.email,client.telegram,client.notes,client.request,'Сохранённый итог встречи','Сопровождение','Изменить данные рождения','Оплаты клиента','Переписка','Запланированы','История','Нумерология','Дизайн человека'])expect(html).toContain(text)
  expect(html).toContain('href="tel:+70000000001"')
  expect(html).toContain('<strong>1</strong><span>проведено встреч</span>')
  expect(html).toContain('<strong>2</strong><span>всего встреч</span>')
  expect(html.match(/class="co-metrics"/g)).toHaveLength(1)
 })
})
