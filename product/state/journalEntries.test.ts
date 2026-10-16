import {describe, expect, it} from 'vitest'
import {clientJournalEntries, type JournalEntry} from './journalEntries'
import type {Appointment} from './model'
describe('client journal linked outcomes', () => {
 const entry:JournalEntry = {id:'old',clientId:'marina',date:'2026-10-12',time:'14:00',author:'specialist',kind:'note',text:'Личная заметка'}
 const appointment:Appointment = {id:'meeting',clientId:'marina',date:'2026-10-15',time:'11:00',title:'Консультация',duration:60,status:'completed',outcome:'Договорились о следующем шаге'}
 it('combines history with the current linked outcome, newest first, without copying it into storage', () => {
   const entries=[entry]
   const result=clientJournalEntries(entries,[appointment],'marina')
   expect(result.map(item=>item.id)).toEqual(['appointment-meeting','old'])
   expect(result[0].appointmentId).toBe('meeting')
   expect(entries).toEqual([entry])
   expect(clientJournalEntries(entries,[{...appointment,outcome:'Уточнённый итог'}],'marina')[0].text).toBe('Уточнённый итог')
 })
 it('does not expose other clients or empty outcomes and preserves cancelled history', () => {
   const result=clientJournalEntries([],[{...appointment,status:'cancelled'}, {...appointment,id:'empty',outcome:' '}, {...appointment,id:'other',clientId:'other'}],'marina')
   expect(result).toHaveLength(1)
   expect(result[0].appointmentStatus).toBe('cancelled')
 })
})
