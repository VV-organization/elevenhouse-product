import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {constraintMessage} from './validationCopy'
import {clientFullName} from './state/names'
import {getLocale, localeTag, setLocale, tr, uiText} from './i18n'
import {countLabel, money} from './modules/ModuleKit'
import {initialAppointmentDraft} from './state/appointmentDraft'
import {addAppointment, createExamplePractice, formatDate, TODAY} from './state/model'

beforeEach(() => setLocale('ru'))
afterEach(() => setLocale('ru'))

describe('interface language', () => {
  it('switches explicit interface copy in both directions', () => {
    expect(getLocale()).toBe('ru')
    expect(localeTag()).toBe('ru-RU')
    expect(tr('Сохранить изменения', 'Save changes')).toBe('Сохранить изменения')
    setLocale('en')
    expect(getLocale()).toBe('en')
    expect(localeTag()).toBe('en-GB')
    expect(tr('Сохранить изменения', 'Save changes')).toBe('Save changes')
    setLocale('ru')
    expect(tr('Сохранить изменения', 'Save changes')).toBe('Сохранить изменения')
  })

  it('retranslates existing interface feedback without replacing form state', () => {
    const feedback = tr('Изменения успешно сохранены.', 'Your changes have been saved.')
    const draft = {name: 'Мария Иванова', text: 'Мои выводы — только для меня'}
    setLocale('en')
    expect(uiText(feedback)).toBe('Your changes have been saved.')
    const englishFeedback = tr('Не удалось сохранить.', 'Could not save.')
    setLocale('ru')
    expect(uiText(englishFeedback)).toBe('Не удалось сохранить.')
    expect(uiText(feedback)).toBe('Изменения успешно сохранены.')
    expect(draft).toEqual({name: 'Мария Иванова', text: 'Мои выводы — только для меня'})
  })

  it('leaves unknown strings intact instead of guessing a translation', () => {
    const clientText = 'Софья Ли: обсудить переезд в Zürich, запись № 9817'
    setLocale('en')
    expect(uiText(clientText)).toBe(clientText)
    expect(uiText('')).toBe('')
    setLocale('ru')
    expect(uiText(clientText)).toBe(clientText)
  })

  it('uses local date and number conventions while keeping the currency', () => {
    expect(formatDate('2026-03-01')).toMatch(/^1 марта 2026/)
    expect(money(12345).replace(/\s/g, ' ')).toBe('12 345 ₽')
    setLocale('en')
    expect(formatDate('2026-03-01')).toBe('1 March 2026')
    expect(money(12345)).toBe('12,345 ₽')
    expect(formatDate('')).toBe('—')
    expect(formatDate('2026-02-30')).toBe('—')
  })

  it('applies Russian and English plural rules to counts', () => {
    const ru: [string, string, string] = ['клиент', 'клиента', 'клиентов']
    expect([1, 2, 5, 21].map(n => countLabel(n, ru))).toEqual(['1 клиент', '2 клиента', '5 клиентов', '21 клиент'])
    setLocale('en')
    const en: [string, string, string] = ['client', 'clients', 'clients']
    expect([0, 1, 2, 21].map(n => countLabel(n, en))).toEqual(['0 clients', '1 client', '2 clients', '21 clients'])
  })

  it('localizes new draft defaults but preserves drafts and saved appointment titles', () => {
    const ruDraft = initialAppointmentDraft({date: TODAY})
    expect(ruDraft.title).toBe('Консультация')
    setLocale('en')
    expect(initialAppointmentDraft({date: TODAY}).title).toBe('Consultation')
    expect(initialAppointmentDraft({date: TODAY, initialDraft: ruDraft})).toEqual(ruDraft)
    const customDraft = {...ruDraft, title: 'Моя авторская консультация', price: '4800.50', time: '14:30'}
    expect(initialAppointmentDraft({date: TODAY, initialDraft: customDraft})).toEqual(customDraft)
    const appointment = {...createExamplePractice().appointments[0], title: 'Консультация'}
    expect(initialAppointmentDraft({date: TODAY, appointment}).title).toBe('Консультация')
  })

  it('translates scheduling errors while retaining the client name and existing data', () => {
    const practice = createExamplePractice()
    practice.clients[0].name = 'Мария Иванова-Смирнова'
    const before = JSON.stringify(practice)
    const first = practice.appointments[0]
    const overlapping = {clientId: first.clientId, date: first.date, time: first.time, duration: 30, title: 'My consultation'}
    let russianError = ''
    try { addAppointment(practice, overlapping) } catch (error) { russianError = (error as Error).message }
    expect(russianError).toContain('Это время уже занято: Мария Иванова-Смирнова')
    setLocale('en')
    expect(uiText(russianError)).toContain('This time is already booked: Мария Иванова-Смирнова')
    expect(() => addAppointment(practice, overlapping)).toThrow(`This time is already booked: Мария Иванова-Смирнова, ${first.time}, ${first.duration} min.`)
    expect(JSON.stringify(practice)).toBe(before)
  })
})

 describe('localized form errors', () => {
  it('localizes browser constraints and clears valid input feedback', () => {
    const missing = {valueMissing:true} as ValidityState
    expect(constraintMessage(missing, 'text', '', '')).toBe('Заполните это поле.')
    setLocale('en')
    expect(constraintMessage(missing, 'text', '', '')).toBe('Please fill in this field.')
    expect(constraintMessage({typeMismatch:true} as ValidityState, 'email', '', '')).toBe('Enter a valid email address.')
    expect(constraintMessage({rangeUnderflow:true} as ValidityState, 'number', '5', '10')).toBe('Enter a value of at least 5.')
    expect(constraintMessage({valid:true} as ValidityState, 'text', '', '')).toBe('')
  })
  it('validates names in the chosen language without rewriting names', () => {
    setLocale('en')
    expect(() => clientFullName('  ', 'Lee')).toThrow("Enter the client's name.")
    expect(() => clientFullName('Анна', '  ')).toThrow('Enter a last name')
    expect(clientFullName(' Анна ', ' Иванова ')).toBe('Анна Иванова')
  })
 })
