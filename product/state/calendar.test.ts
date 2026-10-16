import {describe,it,expect} from 'vitest'
import {monthDays,shiftDay,shiftMonth} from './calendar'
describe('calendar navigation',()=>{
 it('starts weeks on Monday and includes every October date once',()=>{const days=monthDays('2026-10-15');expect(days[0]).toBe('2026-09-28');expect(days.at(-1)).toBe('2026-11-01');expect(days.filter(d=>d.startsWith('2026-10'))).toHaveLength(31);expect(new Set(days).size).toBe(days.length)})
 it('moves between days across month and year boundaries',()=>{expect(shiftDay('2026-12-31',1)).toBe('2027-01-01');expect(shiftDay('2026-03-01',-1)).toBe('2026-02-28')})
 it('clamps month movement to the last valid day including leap years',()=>{expect(shiftMonth('2026-01-31',1)).toBe('2026-02-28');expect(shiftMonth('2028-01-31',1)).toBe('2028-02-29');expect(shiftMonth('2026-01-15',-1)).toBe('2025-12-15')})
})
