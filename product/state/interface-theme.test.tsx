import {afterEach,describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {useInterfaceTheme} from './interface-theme'

afterEach(()=>vi.unstubAllGlobals())
describe('temporarily dark-only interface',()=>{
 it('ignores a saved light theme and light URL fallback without erasing the preference',()=>{
  const setItem=vi.fn(),getItem=vi.fn(()=> 'light')
  vi.stubGlobal('localStorage',{getItem,setItem})
  let changeTheme:ReturnType<typeof useInterfaceTheme>[1]=()=>{}
  function Screen(){const [theme,change]=useInterfaceTheme('theme','light');changeTheme=change;return <main data-theme={theme}/>}
  expect(renderToStaticMarkup(<Screen/>)).toContain('data-theme="dark"')
  changeTheme('light')
  expect(setItem).not.toHaveBeenCalled()
  expect(renderToStaticMarkup(<Screen/>)).toContain('data-theme="dark"')
 })
 it('stays dark when browser storage is unavailable',()=>{
  vi.stubGlobal('localStorage',{getItem(){throw new Error('Storage blocked')}})
  function Screen(){const [theme]=useInterfaceTheme('theme','light');return <main data-theme={theme}/>}
  expect(renderToStaticMarkup(<Screen/>)).toContain('data-theme="dark"')
 })
})
