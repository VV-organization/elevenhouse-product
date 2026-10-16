import {describe,it,expect} from 'vitest'
import {dateParts,numerology,nameNumber,matrix,compositeMatrix,matrixYear,reduceNumber} from './calculationMethods'
describe('restored deterministic calculation methods',()=>{
 it('rejects impossible dates rather than rolling over',()=>{expect(dateParts('2023-02-29')).toBeNull();expect(dateParts('2024-02-29')?.day).toBe(29);expect(numerology('', 'Анна',2026)).toBeNull();expect(matrixYear('1990-03-14',0,'2026-10-16')).toBeNull();expect(numerology('1990-03-14','Анна',NaN)).toBeNull()})
 it('preserves master numbers and source name alphabet',()=>{expect(reduceNumber(29)).toBe(11);expect(reduceNumber(22)).toBe(22);expect(nameNumber('Anna')).toBeNull();expect(nameNumber('А')).toBe(1);expect(nameNumber('Ё')).toBe(7)})
 it('reproduces the source psychomatrix working numbers',()=>{const n=numerology('1990-03-14','Марина Иванова',2026)!;expect(n.work).toEqual([27,9,25,7]);expect(n.life).toBe(9);expect(n.personalYear).toBe(9);expect(n.months).toHaveLength(12);expect(n.counts[9]).toBe(3);expect(n.lines[0]).toBe(n.counts[1]+n.counts[4]+n.counts[7])})
 it('keeps original 22-arcana construction and symmetric composite',()=>{const a=matrix('1990-03-14')!,b=matrix('1987-07-22')!;expect([a.A,a.B,a.C,a.D,a.E]).toEqual([14,3,19,9,9]);expect(a.chakras).toHaveLength(7);expect(compositeMatrix(a,b)).toEqual(compositeMatrix(b,a));expect(compositeMatrix(a,b).A).toBe(9)})
 it('uses the actual birthday boundary for age, with an explicit year',()=>{expect(matrixYear('1990-03-14',2026,'2026-03-13')?.age).toBe(35);expect(matrixYear('1990-03-14',2026,'2026-03-14')?.age).toBe(36);expect(matrixYear('1990-03-14',2027,'2026-03-14')?.personalYear).not.toBe(matrixYear('1990-03-14',2026,'2026-03-14')?.personalYear)})
})
