import type {Practice} from './model'
import { createMemberPractice, memberServices, memberPayments } from './memberCore'
import { memberWorkspaceModules } from './memberModules'

export const MEMBER_EMAIL = 'anna@elevenhouse.test'
export const MEMBER_SCOPE = 'member-anna'
export type LocalAccount = `local:${'email'|'phone'}:${string}`
export type AccountKind = 'mine' | 'example' | 'member' | LocalAccount

export function accountForIdentity(channel: string, identifier: string): AccountKind {
  const normalized = channel === 'phone' ? identifier.replace(/\D/g, '') : identifier.trim().normalize('NFC').toLowerCase()
  if (channel === 'email' && normalized === MEMBER_EMAIL) return 'member'
  return `local:${channel === 'phone' ? 'phone' : 'email'}:${encodeURIComponent(normalized)}`
}
export function storedAccount(value: string | null): AccountKind {
  if (value === 'member' || value === 'example' || value === 'mine') return value
  const match = value?.match(/^local:(email|phone):(.+)$/)
  if (match) {
    try {
      if (accountForIdentity(match[1], decodeURIComponent(match[2])) === value) return value as LocalAccount
    } catch { /* Ignore malformed stored sessions without touching saved practices. */ }
  }
  return 'mine'
}
export function accountPracticeKey(account: AccountKind): string {
  return `eh-product-v1-${account === 'member' ? MEMBER_SCOPE : account}`
}
export function accountModuleScope(account: AccountKind): string | null {
  return account === 'member' ? MEMBER_SCOPE : account.startsWith('local:') ? account : null
}
export function memberModuleValue<T>(key: string, initial: () => T): T {
  const modules: Record<string, unknown> = { ...memberWorkspaceModules, services: memberServices, payments: memberPayments }
  return Object.prototype.hasOwnProperty.call(modules, key) ? structuredClone(modules[key]) as T : initial()
}
export { createMemberPractice }

// Upgrade only original seed names; keep renamed clients and all other saved data.
export function upgradeSeedClientNames(practice:Practice):Practice {
 const names:Record<string,[string,string]>={marina:['Марина','Марина Иванова'],dmitry:['Дмитрий','Дмитрий Петров'],olga:['Ольга','Ольга Смирнова']}
 return {...practice,clients:practice.clients.map(client=>{const seed=names[client.id];return seed&&client.name===seed[0]?{...client,name:seed[1]}:client})}
}
