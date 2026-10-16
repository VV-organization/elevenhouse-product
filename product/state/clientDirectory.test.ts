import {describe,it,expect} from 'vitest'
import {createExamplePractice} from './model'
import {moveClientStage,addClientStage,clientTotals} from './clientDirectory'
describe('client directory parity',()=>{
 it('moves a client without losing details and validates the target',()=>{const p=createExamplePractice();const next=moveClientStage(p,p.clients[0].id,'paused');expect(next.clients[0]).toMatchObject({...p.clients[0],stage:'paused',updatedAt:expect.any(String)});expect(()=>moveClientStage(p,p.clients[0].id,'unknown')).toThrow()})
 it('allows a named custom stage and prevents duplicate names',()=>{const p=addClientStage(createExamplePractice(),'Сопровождение');expect(moveClientStage(p,p.clients[0].id,p.clientStages![0].id).clients[0].stage).toBe(p.clientStages![0].id);expect(()=>addClientStage(p,'сопровождение')).toThrow()})
 it('counts received money only, not pending or refunded amounts',()=>{const base={id:'p',clientId:'c',serviceId:'s',serviceName:'S',date:'2026-10-15',commission:0,amount:100};expect(clientTotals('c',[{...base,status:'paid'},{...base,id:'b',status:'pending'},{...base,id:'d',status:'refunded'}])).toBe(100)})
})
