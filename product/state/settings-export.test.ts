import {describe,it,expect} from 'vitest'
import {createWorkspaceExport,redactExportCredentials,emptyOwnBirth,ownBirthError,type ExportStorage} from './settings-export'
function storage(entries:Record<string,string>):ExportStorage{const keys=Object.keys(entries);return {length:keys.length,key:i=>keys[i]??null,getItem:k=>entries[k]??null}}
describe('workspace data export',()=>{
 it('exports every saved current-account module and current in-memory practice without mixing accounts',()=>{
  const source=storage({'eh-product-v2-member-anna-conversations':JSON.stringify([{text:'A conversation'}]),'eh-product-v2-member-anna-services':JSON.stringify([{name:'Session',price:1000}]),'eh-product-v2-member-anna-some-future-module':JSON.stringify({custom:'kept'}),'eh-product-v2-example-services':JSON.stringify([{name:'Other account'}]),'eh-product-v1-session':'member','unrelated':'secret'})
  const result=createWorkspaceExport(source,'member-anna',{clients:[{id:'1',name:'Anna'}]})
  expect(result.modules).toEqual({conversations:[{text:'A conversation'}],services:[{name:'Session',price:1000}],'some-future-module':{custom:'kept'}})
  expect(result.practice).toEqual({clients:[{id:'1',name:'Anna'}]});expect(JSON.stringify(result)).not.toContain('Other account')
 })
 it('removes nested credentials, bearer/JWT strings and signed URL credentials while retaining meaningful records',()=>{
  const input={email:'anna@example.com',access_token:'abc',settings:{passwordHash:'hash',secretKey:'key',enabled:true},files:[{url:'https://user:pass@example.com/file?token=hidden&name=notes&X-Amz-Signature=secret#access_token=secret',name:'Notes'}],authorization:'Bearer xyz',note:'Bearer abc.def.ghi',key:'-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----'}
  expect(redactExportCredentials(input)).toEqual({email:'anna@example.com',settings:{enabled:true},files:[{url:'https://example.com/file?name=notes',name:'Notes'}],note:'Bearer [redacted]',key:'[redacted]'})
  expect(input.access_token).toBe('abc')
 })
 it('includes in-memory settings, preserves unparsed local recovery material safely and excludes credential modules',()=>{
  const result=createWorkspaceExport(storage({'eh-product-v2-mine-settings':'{"theme":"old"}','eh-product-v2-mine-auth-token':'{"value":"secret"}','eh-product-v2-mine-notes':'a text note','eh-product-v2-mine-password':'secret'}),'mine',{}, {settings:{theme:'new'}})
  expect(result.modules).toEqual({settings:{theme:'new'},notes:'a text note'});expect(result.unparsedModules).toEqual(['notes'])
 })
})
describe('practitioner birth data',()=>{
 it('keeps unknown time explicit and prevents invalid or future birth dates',()=>{
  const base={...emptyOwnBirth(),date:'1990-07-14',place:'Saint Petersburg'}
  expect(ownBirthError(base,'2026-10-16')).toBe('');expect(ownBirthError({...base,date:'1990-02-31'},'2026-10-16')).toBe('date');expect(ownBirthError({...base,date:'2027-01-01'},'2026-10-16')).toBe('date')
  expect(ownBirthError({...base,timeUnknown:false,time:''},'2026-10-16')).toBe('time');expect(ownBirthError({...base,timeUnknown:false,time:'08:30'},'2026-10-16')).toBe('')
  expect(ownBirthError({...emptyOwnBirth(),showOwnChart:true},'2026-10-16')).toBe('date')
 })
})
