import {tr} from '../i18n'
export type ClientTab = 'overview' | 'chart' | 'notes'
export const sectionNames: Record<string, string> = {
 plans:'Тарифы и доступ',dashboard:'Обзор практики',business:'Моя практика',numbers:'Нумерология',matrix:'Матрица судьбы',hd:'Дизайн человека','astro-journal':'Астродневник',reference:'Справочник', 'public-profile':'Личная страница', today: 'Сегодня', clients: 'Клиенты', calendar: 'Календарь', tools: 'Расчёты',
 messages: 'Сообщения', practice: 'Все разделы', services: 'Продукты и услуги',
 finance: 'Финансы', analytics: 'Аналитика', journal: 'Заметки и итоги',
 'astro-calendar': 'Астрокалендарь и задачи', library: 'Мои материалы', content: 'Контент',
 automations: 'Воронки и автоматизация', reviews: 'Отзывы', settings: 'Настройки профиля',
}
const englishSections: Record<string,string> = {
 plans:'Plans and access',dashboard:'Practice overview',business:'My practice',numbers:'Numerology',matrix:'Destiny matrix',hd:'Human Design','astro-journal':'Astro journal',reference:'Reference library','public-profile':'Public profile',today:'Today',clients:'Clients',calendar:'Calendar',tools:'Calculations',messages:'Messages',practice:'All sections',services:'Products and services',finance:'Finance',analytics:'Analytics',journal:'Notes and outcomes','astro-calendar':'Astro calendar and tasks',library:'My materials',content:'Content',automations:'Funnels and automation',reviews:'Reviews',settings:'Profile settings',
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
