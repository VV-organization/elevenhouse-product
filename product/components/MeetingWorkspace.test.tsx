import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {MeetingWorkspace,MeetingResourceView} from './MeetingWorkspace'
import {createExamplePractice} from '../state/model'
import {emptyMeetingSession} from '../state/meetingWorkspace'
const p=createExamplePractice(),a=p.appointments[0],client=p.clients.find(c=>c.id===a.clientId)!
const props={appointment:a,client,onClose:()=>{},onNotes:()=>{}}
describe('meeting workspace presentation',()=>{
 it('does not claim recording, AI processing or message delivery without adapter',()=>{const html=renderToStaticMarkup(<MeetingWorkspace {...props}/>);expect(html).toContain('Видеосвязь не подключена');expect(html).toContain('Запись не ведётся');expect(html).not.toContain('Запись идёт');expect(html).not.toContain('Клиент дал согласие');expect(html).not.toContain('Отправить</button>')})
 it('renders supplied transcript literally and maintains privacy labels on material links',()=>{const s={...emptyMeetingSession(a.id),transcript:{status:'ready' as const,text:'<script>not executable</script>'},materials:[{id:'f',title:'Личный разбор',url:'https://example.org/file.pdf',visibility:'private' as const}]};const html=renderToStaticMarkup(<MeetingWorkspace {...props} session={s} initialTab="materials"/>);expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');expect(html).toContain('Только вам');expect(html).toContain('https://example.org/file.pdf')})
 it('presents a real media player only for supplied safe ready URL',()=>{const html=renderToStaticMarkup(<MeetingResourceView kind="recording" resource={{status:'ready',url:'https://example.org/recording.mp4'}}/>);expect(html).toContain('<video');expect(html).toContain('controls=""');expect(renderToStaticMarkup(<MeetingResourceView kind="recording" resource={{status:'ready',url:'javascript:bad'}}/>)).not.toContain('<video')})
 it('keeps unavailable AI and manual outcome distinct',()=>{const html=renderToStaticMarkup(<MeetingWorkspace {...props} initialTab="outcome" onOutcome={()=>{}}/>);expect(html).toContain('Подготовка AI-черновика пока не подключена');expect(html).toContain('Выводы и договорённости');expect(html).not.toContain('AI готовит резюме')})
})
