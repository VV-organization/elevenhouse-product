import {describe,expect,it,afterEach} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {setLocale} from '../i18n'
import {availableMessageThreads,conversationMessages,linkMessageThread,unlinkMessageThread,safeMeetingUrl,type ExternalMessageThread} from './communicationMessages'
import {MessageDraftAssistant,MessageVideoMeeting} from '../modules/communication-messages'
const thread:ExternalMessageThread={id:'telegram-one',name:'Anna',channel:'telegram',address:'@anna',messages:[{id:'m1',from:'client',text:'Question in Telegram',time:'10:00',sentAt:'2026-10-16T10:00:00Z'}]}
afterEach(()=>setLocale('ru'))
describe('existing message threads',()=>{
 it('links a source snapshot and restores its channel history after reload',()=>{
  const source=structuredClone(thread),linked=linkMessageThread({},source,'anna');source.messages[0].text='Later edit'
  const persisted=JSON.parse(JSON.stringify(linked)),available=availableMessageThreads([],persisted)
  expect(available[0].messages[0].text).toBe('Question in Telegram')
  const messages=conversationMessages([{id:'m1',from:'you',text:'Earlier portal message',time:'09:00',sentAt:'2026-10-16T09:00:00Z'}],available)
  expect(messages.map(m=>m.text)).toEqual(['Earlier portal message','Question in Telegram'])
  expect(messages[1]).toMatchObject({id:'external:telegram-one:m1',channel:'telegram'})
 })
 it('unlinks without deleting messages and refuses linking another client’s active thread',()=>{
  const linked=linkMessageThread({},thread,'anna')
  expect(()=>linkMessageThread(linked,thread,'pavel')).toThrow('already-linked')
  const detached=unlinkMessageThread(linked,thread.id)
  expect(detached[thread.id].clientId).toBe('');expect(detached[thread.id].thread).toEqual(thread)
  expect(linked[thread.id].clientId).toBe('anna')
  expect(linkMessageThread(detached,thread,'pavel')[thread.id].clientId).toBe('pavel')
 })
 it('uses current supplied history once while preserving disconnected saved sources',()=>{
  const linked=linkMessageThread({},thread,'anna'),updated={...thread,messages:[...thread.messages,{id:'m2',from:'you' as const,text:'Reply',time:'11:00'}]}
  expect(availableMessageThreads([updated],linked)).toEqual([updated])
  expect(availableMessageThreads([],linked)).toEqual([thread])
 })
})
describe('message assistance availability',()=>{
 it('offers explicit AI review entry without writing a fabricated reply',()=>{
  setLocale('en');const html=renderToStaticMarkup(<MessageDraftAssistant request={{clientId:'anna',clientName:'Anna',channel:'telegram',messages:thread.messages,draft:'My unfinished reply',language:'en'}} onApply={()=>{throw Error('must not apply on render')}}/>)
  expect(html).toContain('AI reply draft');expect(html).not.toContain('Add to my draft');expect(html).not.toContain('Thursday')
 })
 it('opens only the selected client’s supplied video meeting',()=>{
  setLocale('en');const html=renderToStaticMarkup(<MessageVideoMeeting clientId="anna" clientName="Anna" data={{meetingUrls:{anna:'https://meet.example.com/anna',pavel:'https://meet.example.com/pavel'}}}/>)
  expect(html).toContain('https://meet.example.com/anna');expect(html).not.toContain('/pavel');expect(html).toContain('noopener noreferrer')
  const unavailable=renderToStaticMarkup(<MessageVideoMeeting clientId="anna" clientName="Anna"/>)
  expect(unavailable).toContain('Video meeting');expect(unavailable).not.toContain('href=')
 })
 it.each(['javascript:alert(1)','data:text/html,hello','https://user:secret@example.com','http://example.com','not a url'])('rejects unsafe video URL %s',value=>expect(safeMeetingUrl(value)).toBe(''))
})
