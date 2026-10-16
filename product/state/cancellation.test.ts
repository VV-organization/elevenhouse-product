import {describe,it,expect} from 'vitest'
import {createExamplePractice,recordCancellation,parsePractice,setAppointmentStatus} from './model'
describe('cancellation terms',()=>{
 const decision={kind:'cancel' as const,policy:'partial' as const,refundPercent:50,reason:'Agreed late cancellation',recordedAt:'2026-10-15T10:00:00Z'}
 it('retains terms and price through reload without inventing a payment or refund',()=>{const p=createExamplePractice();p.appointments[0].price=4900;const changed=recordCancellation(p,'session-marina',decision);expect(changed.appointments[0]).toMatchObject({status:'cancelled',price:4900,cancellation:decision});expect(parsePractice(JSON.stringify(changed))).toEqual(changed);expect(p.appointments[0].status).toBe('confirmed')})
 it('requires a reason and a valid refund share',()=>{for(const d of [{...decision,reason:' '},{...decision,refundPercent:101}])expect(()=>recordCancellation(createExamplePractice(),'session-marina',d)).toThrow()})
 it('preserves a no-show exception and allows restoring the same appointment',()=>{const p=recordCancellation(createExamplePractice(),'session-marina',{...decision,kind:'no-show',policy:'reschedule',refundPercent:0});expect(p.appointments[0].attendance).toBe('no-show');const restored=setAppointmentStatus(p,'session-marina','confirmed');expect(restored.appointments[0]).toMatchObject({id:'session-marina',status:'confirmed',cancellation:{policy:'reschedule'}});expect(restored.appointments[0].attendance).toBeUndefined()})
})
