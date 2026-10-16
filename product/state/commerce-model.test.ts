import {describe,it,expect} from 'vitest'
import {commerceDefaults,commercePrice,commerceError,previousRange,validRange,csvDocument,moneyDraftError,type MoneyDraft} from './commerce-model'
describe('commerce conditions',()=>{
 it('prices packages separately from the unit price and does not charge free products',()=>{const c={...commerceDefaults(5000),sale:'pack' as const,packCount:3,packDiscount:10};expect(commercePrice(c,5000)).toBe(13500);expect(commercePrice({...c,sale:'free'},5000)).toBe(0);expect(c.unitPrice).toBe(5000)})
 it('requires a deliverable and valid conditional values',()=>{expect(commerceError({...commerceDefaults(),formats:[]})).toBe('formats');expect(commerceError({...commerceDefaults(),sale:'pack',packCount:1})).toBe('pack');expect(commerceError({...commerceDefaults(),timing:'async',deadlineDays:0})).toBe('deadline');expect(commerceError({...commerceDefaults(),audience:'group',capacity:1})).toBe('capacity')})
 it('rejects unsafe media addresses and invalid extra prices',()=>{expect(commerceError({...commerceDefaults(),coverUrl:'javascript:alert(1)'})).toBe('url');expect(commerceError({...commerceDefaults(),extras:[{id:'x',name:'Extra',kind:'percent',price:101}]})).toBe('extras')})
})
describe('real local reporting',()=>{
 it('uses an equally long preceding calendar range across month/year boundaries',()=>{expect(previousRange({from:'2026-01-01',to:'2026-01-07'})).toEqual({from:'2025-12-25',to:'2025-12-31'});expect(previousRange({from:'2024-03-01',to:'2024-03-01'})).toEqual({from:'2024-02-29',to:'2024-02-29'})})
 it('rejects nonexistent or reversed dates',()=>{expect(validRange({from:'2026-02-30',to:'2026-03-01'})).toBe(false);expect(validRange({from:'2026-10-02',to:'2026-10-01'})).toBe(false)})
 it('exports quotes/newlines and neutralizes spreadsheet formulas',()=>{expect(csvDocument([['=HYPERLINK("x")','hello\nworld']])).toBe('\uFEFF"\'=HYPERLINK(""x"")";"hello\nworld"')})
})
describe('money request preparation',()=>{
 const draft={kind:'refund' as const,paymentId:'p1',amount:500,reason:'Client request',destination:''}
 it('does not allow a refund above the payment or duplicate prepared refunds',()=>{expect(moneyDraftError(draft,499,[])).toBe('limit');const existing:MoneyDraft={...draft,id:'r1',createdAt:'2026-10-15',status:'prepared'};expect(moneyDraftError(draft,500,[existing])).toBe('duplicate');expect(moneyDraftError(draft,500,[{...existing,status:'cancelled'}])).toBeUndefined()})
 it('requires payout destination but accepts an unknown balance only as a draft',()=>{expect(moneyDraftError({...draft,kind:'payout',destination:''},null,[])).toBe('destination');expect(moneyDraftError({...draft,kind:'payout',destination:'Saved bank account'},null,[])).toBeUndefined()})
})
