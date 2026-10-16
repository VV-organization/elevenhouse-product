import {describe,it,expect} from 'vitest'
import {familyError,familyAnswers,type FamilyProfile} from './portal-family-model'
const profile:FamilyProfile={id:'partner',name:'Partner Name',relation:'Partner',birthDate:'1988-07-22',birthTime:'',birthPlace:'Kaliningrad',unknownTime:true}
describe('family birth profiles',()=>{
 it('preserves unknown time rather than fabricating noon',()=>{expect(familyError(profile)).toBe('');expect(familyAnswers(profile,true)).toMatchObject({partnerUnknown:'yes',partnerTime:'',partnerDate:'1988-07-22'});expect(familyAnswers(profile)).toHaveProperty('birthName','Partner Name')})
 it('rejects impossible dates, future dates and missing time without unknown flag',()=>{expect(familyError({...profile,birthDate:'2026-02-30'})).not.toBe('');expect(familyError({...profile,birthDate:'2027-01-01'},'2026-10-16')).not.toBe('');expect(familyError({...profile,unknownTime:false})).not.toBe('')})
 it('copies a snapshot without retaining mutable profile references',()=>{const answers=familyAnswers(profile);profile.name='Changed';expect(answers.birthName).toBe('Partner Name')})
})
