import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {setLocale} from '../i18n'
import {createExamplePractice} from '../state/model'
import {CalculationWorkspace} from './CalculationWorkspace'
import {Tools} from '../modules/Tools'
const captured=vi.hoisted(()=>({astronomy:vi.fn(),method:vi.fn()}))
vi.mock('./AstronomyCalculations',()=>({AstronomyCalculations:(props:unknown)=>{captured.astronomy(props);return null}}))
vi.mock('./MethodCalculations',()=>({MethodCalculations:(props:unknown)=>{captured.method(props);return null}}))
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks()})
it.each(['natal','hd','numbers','matrix'])('passes supplied adapters through the %s workspace route',method=>{
 setLocale('en');vi.stubGlobal('window',{location:{search:`?calculationMethod=${method}`}})
 const calculate=vi.fn(),interpret=vi.fn(),practice=createExamplePractice()
 renderToStaticMarkup(<CalculationWorkspace practice={practice} onOpenClient={()=>{}} clientId={practice.clients[0].id} calculate={calculate} interpret={interpret}/>)
 const child=['natal','hd'].includes(method)?captured.astronomy:captured.method
 expect(child).toHaveBeenCalledWith(expect.objectContaining({method,interpret,...(['natal','hd'].includes(method)?{calculate}:{})}))
 expect(calculate).not.toHaveBeenCalled();expect(interpret).not.toHaveBeenCalled()
})
it('carries real calculation adapters through Tools without substituting sample calculation functions',()=>{
 setLocale('en');vi.stubGlobal('window',{location:{search:'?calculationMethod=hd'}})
 const calculate=vi.fn(),interpret=vi.fn()
 renderToStaticMarkup(<Tools section="tools" practice={createExamplePractice()} onOpenClient={()=>{}} calculate={calculate} interpret={interpret}/>)
 expect(captured.astronomy).toHaveBeenCalledWith(expect.objectContaining({calculate,interpret,method:'hd'}))
})
