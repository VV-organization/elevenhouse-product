import {describe,it,expect} from 'vitest'
import {destinationUrl,readClientTab} from './navigation'
describe('client navigation context',()=>{
 it('restores a client tab from a reloadable or historical URL',()=>{
  expect(readClientTab('https://example.com/?tab=notes#client/marina')).toBe('notes')
  expect(readClientTab('https://example.com/?tab=chart#client/dmitry')).toBe('chart')
 })
 it('does not leak a client tab into another section or accept an unknown tab',()=>{
  expect(readClientTab('https://example.com/?tab=notes#calendar')).toBe('overview')
  expect(readClientTab('https://example.com/?tab=bad#client/marina')).toBe('overview')
 })
 it('keeps date and contextual payment while removing an unrelated client tab',()=>{
  const url=destinationUrl('https://example.com/product/?day=2026-10-15&tab=notes&paymentAppointment=a1#client/marina','finance')
  expect(url.pathname).toBe('/product/')
  expect(url.searchParams.get('day')).toBe('2026-10-15')
  expect(url.searchParams.get('paymentAppointment')).toBe('a1')
  expect(url.searchParams.has('tab')).toBe(false)
  expect(url.hash).toBe('#finance')
 })
 it('returns to the remembered client tab without changing the source URL',()=>{
  const source='https://example.com/?from=clients#messages'
  const url=destinationUrl(source,'client/marina','notes')
  expect(readClientTab(url.href)).toBe('notes')
  expect(url.searchParams.get('from')).toBe('clients')
  expect(source).toBe('https://example.com/?from=clients#messages')
 })
})
