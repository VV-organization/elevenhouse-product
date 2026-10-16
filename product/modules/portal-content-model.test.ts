import {describe,it,expect} from 'vitest'
import {portalContent,contentReadable,safeContentUrl,saveDiaryEntry,migrateDiary,type PortalContentData,type PortalPost} from './portal-content-model'
const now=new Date('2026-10-16T12:00:00Z')
const post:PortalPost={id:'p',title:'Public note',summary:'Preview',body:'Full text',kind:'note',publishedAt:'2026-10-15T12:00:00Z',status:'published',audience:'public'}
const data:PortalContentData={clientId:'marina',specialistId:'a',posts:[post,{...post,id:'paid',audience:'subscribers'},{...post,id:'draft',status:'draft'},{...post,id:'future',publishedAt:'2026-10-20T00:00:00Z'}],materials:[{id:'m',title:'Private PDF',kind:'document',createdAt:'2026-10-15',url:'https://example.org/report.pdf'}],access:[]}
describe('client supplied content',()=>{
 it('isolates all posts and materials by exact client and specialist identities',()=>{
  expect(portalContent(data,'other','a',now)).toEqual({posts:[],materials:[],access:[]})
  expect(portalContent(data,'marina','other',now).materials).toEqual([])
  expect(portalContent(data,undefined,'a',now).posts).toEqual([])
  expect(portalContent(data,'marina','a',now).posts.map(p=>p.id)).toEqual(['p','paid'])
 })
 it('requires exact current supplied grants for subscriber posts and every owned material',()=>{
  expect(contentReadable('post',post,[],now)).toBe(true)
  expect(contentReadable('post',{...post,audience:'subscribers'},[],now)).toBe(false)
  expect(contentReadable('material',data.materials[0],[],now)).toBe(false)
  const grant={id:'g',target:'material' as const,contentId:'m',status:'granted' as const,expiresAt:'2026-10-17T00:00:00Z'}
  expect(contentReadable('material',data.materials[0],[grant],now)).toBe(true)
  expect(contentReadable('material',data.materials[0],[{...grant,target:'post'}],now)).toBe(false)
  for(const expiresAt of ['2026-10-16T12:00:00Z','invalid'])expect(contentReadable('material',data.materials[0],[{...grant,expiresAt}],now)).toBe(false)
  expect(contentReadable('material',data.materials[0],[{...grant,status:'revoked'}],now)).toBe(false)
 })
 it('fails closed on contradictory access records and excludes unsafe media URLs',()=>{
  const grant={id:'g',target:'material' as const,contentId:'m',status:'granted' as const}
  expect(contentReadable('material',data.materials[0],[grant,{...grant,id:'g2',status:'revoked'}],now)).toBe(false)
  for(const url of ['javascript:alert(1)','data:text/html,hello','https://user:password@example.org/a','/private.pdf'])expect(safeContentUrl(url)).toBeUndefined()
  expect(safeContentUrl('https://example.org/a.pdf')).toBe('https://example.org/a.pdf')
 })
})
describe('client dated diary',()=>{
 it('migrates the existing note once without inventing a date or losing text',()=>{
  const migrated=migrateDiary([], 'Old private note')
  expect(migrated).toHaveLength(1);expect(migrated[0].date).toBe('');expect(migrated[0].text).toBe('Old private note')
  expect(migrateDiary(migrated,'Old private note')).toEqual(migrated)
 })
 it('saves distinct dated entries and validates empty text and invalid dates',()=>{
  const draft={date:'2026-10-16',text:'  Felt calm  ',mood:'calm' as const}
  const entries=saveDiaryEntry([],draft,'one','2026-10-16T12:00:00Z')
  expect(entries[0]).toMatchObject({id:'one',text:'Felt calm',mood:'calm',date:'2026-10-16'})
  expect(saveDiaryEntry(entries,{...draft,text:'Second'},'two','now')).toHaveLength(2)
  expect(()=>saveDiaryEntry(entries,{...draft,date:'2026-02-30'},'bad','now')).toThrow()
  expect(()=>saveDiaryEntry(entries,{...draft,text:' '},'bad','now')).toThrow()
  expect(entries[0].text).toBe('Felt calm')
 })
})
