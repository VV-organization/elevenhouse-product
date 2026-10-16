import { describe, expect, it } from 'vitest'
import { accountForIdentity, accountPracticeKey, accountModuleScope, memberModuleValue, storedAccount, MEMBER_EMAIL, MEMBER_SCOPE } from './memberAccount'
import { createMemberPractice, memberPayments, memberServices } from './memberCore'
import { memberWorkspaceModules } from './memberModules'
import { parsePractice, TODAY } from './model'

describe('established member account', () => {
  it('selects the populated account only for its email, preserving other account paths', () => {
    expect(accountForIdentity('email', ` ${MEMBER_EMAIL.toUpperCase()} `)).toBe('member')
    expect(accountForIdentity('email', 'someone@example.com')).not.toBe('mine')
    expect(accountForIdentity('phone', '+7 999 123-45-67')).not.toBe('member')
    expect(storedAccount('member')).toBe('member')
    expect(storedAccount('example')).toBe('example')
    expect(storedAccount(null)).toBe('mine')
  })
  it('restores a populated practice with valid dates, relationships and no schedule collisions', () => {
    const practice = createMemberPractice()
    expect(parsePractice(JSON.stringify(practice))).toEqual(practice)
    expect(practice.onboarded).toBe(true)
    expect(practice.clients.length).toBeGreaterThanOrEqual(12)
    expect(practice.appointments.length).toBeGreaterThanOrEqual(60)
    expect(practice.appointments.filter(a => a.date === TODAY && a.status === 'confirmed')).toHaveLength(3)
    expect(practice.appointments.some(a => a.date < TODAY && a.status === 'completed')).toBe(true)
    expect(practice.appointments.some(a => a.date > TODAY && a.status === 'confirmed')).toBe(true)
  })
  it('keeps all financial rows linked to existing clients and priced services', () => {
    const clients = new Set(createMemberPractice().clients.map(c => c.id))
    expect(memberPayments.length).toBeGreaterThan(30)
    expect(new Set(memberPayments.map(p => p.id)).size).toBe(memberPayments.length)
    for (const payment of memberPayments) {
      const service = memberServices.find(s => s.id === payment.serviceId)
      expect(clients.has(payment.clientId)).toBe(true)
      expect(service).toBeDefined()
      expect(payment.serviceName).toBe(service!.name)
      expect(payment.amount).toBe(service!.price)
      expect(payment.commission).toBe(payment.status === 'paid' ? Math.round(payment.amount * .04) : 0)
    }
    expect(new Set(memberPayments.map(p => p.status))).toEqual(new Set(['paid', 'pending', 'refunded']))
  })
  it('links conversations, journal, reviews and reminders to this account', () => {
    const practice = createMemberPractice(), ids = new Set(practice.clients.map(c => c.id))
    const conversations = memberWorkspaceModules.conversations as { threads: Record<string, unknown[]> }
    for (const id of Object.keys(conversations.threads)) expect(ids.has(id)).toBe(true)
    for (const key of ['journal', 'reviews', 'reminders']) {
      for (const row of memberWorkspaceModules[key] as { clientId: string }[]) expect(ids.has(row.clientId)).toBe(true)
    }
    const events = new Set([...practice.appointments.map(a => a.id), ...practice.clients.map(c => `birthday-${c.id}`)])
    for (const row of memberWorkspaceModules.reminders as { eventId: string }[]) expect(events.has(row.eventId)).toBe(true)
  })
  it('returns independent initial data so editing one browser cannot mutate the account template', () => {
    const first = memberModuleValue<typeof memberServices>('services', () => [])
    first[0].name = 'Изменённое название'
    expect(memberModuleValue<typeof memberServices>('services', () => [])[0].name).toBe(memberServices[0].name)
    expect(memberModuleValue('unconfigured-key', () => 'fallback')).toBe('fallback')
    const practice = createMemberPractice()
    practice.clients[0].notes = 'Changed'
    expect(createMemberPractice().clients[0].notes).not.toBe('Changed')
  })
})

describe('isolated local accounts', () => {
  it('restores the same practice and module scope after normalized repeat login', () => {
    const registered = accountForIdentity('email', '  Elena@Example.com  ')
    const signedIn = accountForIdentity('email', 'elena@example.com')
    const practices = new Map([[accountPracticeKey(registered), {name:'Елена', onboarded:true}]])
    expect(practices.get(accountPracticeKey(signedIn))).toEqual({name:'Елена', onboarded:true})
    expect(accountModuleScope(signedIn)).toBe(accountModuleScope(registered))
    expect(storedAccount(registered)).toBe(registered)
  })
  it('normalizes phone punctuation while keeping email and phone separate', () => {
    expect(accountForIdentity('phone', '+7 (999) 123-45-67')).toBe(accountForIdentity('phone', '79991234567'))
    expect(accountForIdentity('phone', '+79991234567')).not.toBe(accountForIdentity('email', '79991234567'))
  })
  it('keeps new identities separate from one another and all legacy data', () => {
    const accounts = ['mine', 'example', 'member', accountForIdentity('email','first@example.com'), accountForIdentity('email','second@example.com')] as const
    expect(new Set(accounts.map(accountPracticeKey)).size).toBe(accounts.length)
    const firstScope = accountModuleScope(accounts[3])
    const secondScope = accountModuleScope(accounts[4])
    expect(firstScope).not.toBeNull()
    expect(firstScope).not.toBe(secondScope)
    expect(firstScope).not.toBe('mine')
    expect(firstScope).not.toBe('example')
    expect(firstScope).not.toBe(MEMBER_SCOPE)
  })
  it('preserves Anna and legacy session keys without assigning mine to a new contact', () => {
    expect(accountPracticeKey(accountForIdentity('email', MEMBER_EMAIL.toUpperCase()))).toBe('eh-product-v1-member-anna')
    expect(accountModuleScope('member')).toBe(MEMBER_SCOPE)
    expect(accountPracticeKey(storedAccount('mine'))).toBe('eh-product-v1-mine')
    expect(accountPracticeKey(storedAccount('example'))).toBe('eh-product-v1-example')
    expect(accountModuleScope('mine')).toBeNull()
    expect(accountModuleScope('example')).toBeNull()
    expect(accountPracticeKey(accountForIdentity('email','legacy-owner@example.com'))).not.toBe('eh-product-v1-mine')
  })
  it('ignores malformed sessions without accepting arbitrary storage keys', () => {
    for (const value of [null, '', 'unknown', 'local:email:', 'local:email:%', 'local:email:ANN@example.com', 'local:phone:+79991234567']) {
      expect(storedAccount(value)).toBe('mine')
    }
  })
})
