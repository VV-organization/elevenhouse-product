import {tr} from '../i18n'
export type ClientTab = 'overview' | 'chart' | 'notes'
export const sectionNames: Record<string, string> = {
 today: 'Сегодня', clients: 'Клиенты', calendar: 'Календарь', tools: 'Расчёты',
 messages: 'Сообщения', practice: 'Все разделы', services: 'Услуги и цены',
 finance: 'Оплаты', analytics: 'Аналитика', journal: 'Заметки и итоги',
 'astro-calendar': 'Напоминания', library: 'Мои материалы', content: 'Публикации',
 automations: 'Автоматические напоминания', reviews: 'Отзывы', settings: 'Настройки профиля',
}
const englishSections: Record<string,string> = {
 today:'Today',clients:'Clients',calendar:'Calendar',tools:'Calculations',messages:'Messages',practice:'All sections',services:'Services and prices',finance:'Payments',analytics:'Analytics',journal:'Notes and outcomes','astro-calendar':'Reminders',library:'My materials',content:'Posts',automations:'Automatic reminders',reviews:'Reviews',settings:'Profile settings',
}
export function sectionName(page:string) { return tr(sectionNames[page] || 'Сегодня',englishSections[page] || 'Today') }
export function readClientTab(href: string): ClientTab {
 const url = new URL(href)
 if (!url.hash.startsWith('#client/')) return 'overview'
 const tab = url.searchParams.get('tab')
 return tab === 'notes' || tab === 'chart' ? tab : 'overview'
}
export function destinationUrl(href: string, page: string, tab: ClientTab = 'overview'): URL {
 const url = new URL(href)
 url.hash = page
 url.searchParams.delete('tab')
 if (page.startsWith('client/') && tab !== 'overview') url.searchParams.set('tab', tab)
 return url
}
