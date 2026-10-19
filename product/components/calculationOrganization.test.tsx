import {afterEach,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {CalculationWorkspace} from './CalculationWorkspace'
import {AstronomyCalculations} from './AstronomyCalculations'
import {Tools} from '../modules/Tools'
import {createExamplePractice} from '../state/model'
import {setLocale} from '../i18n'

afterEach(()=>vi.unstubAllGlobals())
function setup(){setLocale('en');vi.stubGlobal('window',{location:{search:''}});return createExamplePractice()}
it('keeps all four method choices available while an incomplete birth draft is edited',()=>{
 const practice=setup();practice.clients[0]={...practice.clients[0],birthDate:'',birthPlace:''}
 const html=renderToStaticMarkup(<CalculationWorkspace practice={practice} clientId={practice.clients[0].id} onOpenClient={()=>{}}/>)
 const methods=html.match(/aria-label="Calculation method"[\s\S]*?<\/div>/)?.[0]||''
 expect(methods.match(/<button/g)).toHaveLength(4)
 expect(html.indexOf('aria-label="Calculation method"')).toBeLessThan(html.indexOf('ec-birth-form'))
})
it('offers every astrology mode in named visible groups without hiding individual choices',()=>{
 const practice=setup(),client=practice.clients[0]
 const html=renderToStaticMarkup(<AstronomyCalculations method="natal" source={client} practice={practice} reference={false}/>)
 const groups=html.match(/<fieldset class="ec-type-group"[\s\S]*?<\/fieldset>/g)||[]
 expect(groups).toHaveLength(3)
 expect(groups.join('').match(/<button/g)).toHaveLength(9)
 expect(groups.join('')).not.toContain('<details')
 expect(groups.join('')).toContain('Forecast')
})
it('separates tool navigation from the active workspace with a labelled navigation landmark',()=>{
 const practice=setup()
 const html=renderToStaticMarkup(<Tools section="library" practice={practice} onOpenClient={()=>{}}/>)
 expect(html).toMatch(/<nav[^>]*aria-label="Library sections"/)
 expect(html).toContain('aria-current="page"')
 expect(html).toContain('ec-tool-content')
})
it('opens one interpretation beside a selectable result list while retaining edit and delete actions',async()=>{
 setup()
 const {ReferenceCalculations}=await import('./ReferenceCalculations')
 const html=renderToStaticMarkup(<ReferenceCalculations example/>)
 expect(html).toContain('aria-label="Interpretations"')
 expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
 expect(html).toContain('ec-reference-detail')
 expect(html.match(/>Edit<\/button>/g)).toHaveLength(1)
 expect(html.match(/>Delete<\/button>/g)).toHaveLength(1)
})

it('places calculation setup in the active work area with a heading before a result exists',()=>{
 const practice=setup(),client=practice.clients[0]
 const html=renderToStaticMarkup(<AstronomyCalculations method="natal" source={client} practice={practice} reference={false}/>)
 expect(html).toContain('<h2>Natal chart</h2>')
 expect(html.indexOf('ec-astro-result')).toBeLessThan(html.indexOf('<form'))
 expect(html.slice(html.indexOf('ec-astro-result'))).toContain('>Calculate</button>')
 const referenceHtml=renderToStaticMarkup(<AstronomyCalculations method="natal" source={client} practice={practice} reference/>)
 expect(referenceHtml.indexOf('ec-astro-result')).toBeLessThan(referenceHtml.indexOf('<form'))
 expect(referenceHtml.match(/<form/g)).toHaveLength(1)
})
