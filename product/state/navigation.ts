export type ClientTab = 'overview' | 'chart' | 'notes'
export const sectionNames: Record<string, string> = {
 today: 'Сегодня', clients: 'Клиенты', calendar: 'Календарь', tools: 'Расчёты',
 messages: 'Сообщения', practice: 'Все разделы', services: 'Услуги и цены',
 finance: 'Оплаты', analytics: 'Аналитика', journal: 'Заметки и итоги',
 'astro-calendar': 'Напоминания', library: 'Мои материалы', content: 'Публикации',
 automations: 'Автоматические напоминания', reviews: 'Отзывы', settings: 'Настройки профиля',
}
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
