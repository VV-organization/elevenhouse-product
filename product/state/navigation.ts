import {tr} from '../i18n'
export type ClientTab = 'overview' | 'chart' | 'notes'
export const sectionNames: Record<string, string> = {
 'public-profile':'Личная страница', today: 'Сегодня', clients: 'Клиенты', calendar: 'Календарь', tools: 'Расчёты',
 messages: 'Сообщения', practice: 'Все разделы', services: 'Услуги и цены',
 finance: 'Оплаты', analytics: 'Аналитика', journal: 'Заметки и итоги',
 'astro-calendar': 'Астрокалендарь и задачи', library: 'Мои материалы', content: 'Публикации',
 automations: 'Воронки и автоматизация', reviews: 'Отзывы', settings: 'Настройки профиля',
}
const englishSections: Record<string,string> = {
 'public-profile':'Public profile',today:'Today',clients:'Clients',calendar:'Calendar',tools:'Calculations',messages:'Messages',practice:'All sections',services:'Services and prices',finance:'Payments',analytics:'Analytics',journal:'Notes and outcomes','astro-calendar':'Astro calendar and tasks',library:'My materials',content:'Posts',automations:'Funnels and automation',reviews:'Reviews',settings:'Profile settings',
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
