import {useSyncExternalStore} from 'react'
import {AUTH_LOCALE_KEY, resolveLocale, type AuthLocale} from './auth/authCopy'

export type Locale = AuthLocale
let current: Locale | undefined
const listeners = new Set<() => void>()
export function getLocale(): Locale {
  if (current) return current
  if (typeof window === 'undefined') return 'ru'
  let saved: string | null = null
  try { saved = localStorage.getItem(AUTH_LOCALE_KEY) || localStorage.getItem('eh_lang') } catch { /* Storage is optional. */ }
  current = resolveLocale(new URLSearchParams(window.location.search).get('lang'), saved, navigator.language)
  document.documentElement.lang = current
  return current
}
export function setLocale(locale: Locale) {
  current = locale
  if (typeof window !== 'undefined') {
    document.documentElement.lang = locale
    try { localStorage.setItem(AUTH_LOCALE_KEY, locale); localStorage.setItem('eh_lang', locale) } catch { /* Keep the in-memory choice. */ }
    const url = new URL(window.location.href)
    if (url.searchParams.has('lang')) { url.searchParams.set('lang', locale); window.history.replaceState(null, '', url) }
  }
  listeners.forEach(listener => listener())
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getLocale, () => 'ru' as Locale)
  return {locale, setLocale}
}
/** Only interface copy belongs here. Never pass client-authored content for translation. */
const interfaceCopy = new Map<string, [string, string]>()
export function tr(ru: string, en: string): string {
  interfaceCopy.set(ru, [ru, en]); interfaceCopy.set(en, [ru, en])
  return getLocale() === 'en' ? en : ru
}
/** Re-render already created interface feedback; never use for client-authored text. */
export function uiText(text: string): string {
  const pair = interfaceCopy.get(text)
  return pair ? pair[getLocale() === 'en' ? 1 : 0] : text
}
export function localeTag() { return getLocale() === 'en' ? 'en-GB' : 'ru-RU' }
export function LanguageControl() {
  const {locale, setLocale} = useLocale()
  return <fieldset className="ep-language-control"><legend>{tr('Язык интерфейса', 'Interface language')}</legend><div>{(['ru','en'] as const).map(language => <button type="button" key={language} lang={language} aria-pressed={locale === language} onClick={() => setLocale(language)}>{language === 'ru' ? 'Русский' : 'English'}</button>)}</div></fieldset>
}
