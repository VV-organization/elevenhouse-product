import { TODAY } from './model'

type Dated = { date: string; time: string }
export const chronological = (a: Dated, b: Dated) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
export const newestFirst = (a: Dated, b: Dated) => chronological(b, a)

export function meetingGroups<T extends Dated & { status: string }>(items: readonly T[], today = TODAY) {
  const isUpcoming = (item: T) => item.date >= today && (item.status === 'confirmed' || item.status === 'pending')
  return { upcoming: items.filter(isUpcoming).sort(chronological), history: items.filter(item => !isUpcoming(item)).sort(newestFirst) }
}

export function reminderOrder<T extends Dated & { done: boolean }>(a: T, b: T) {
  return Number(a.done) - Number(b.done) || (a.done ? newestFirst(a, b) : chronological(a, b))
}

// Older saved conversations only have Russian display dates from the original workspace year.
const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
export function messageOrderKey(message?: { time: string; sentAt?: string }) {
  if (!message) return ''
  if (message.sentAt) return message.sentAt
  const match = message.time.match(/(\d{1,2})\s+([а-я]+)(?:\s+(\d{4}))?(?:\s*·\s*(\d{2}:\d{2}))?/i)
  if (!match || !months.includes(match[2])) return ''
  return `${match[3] || TODAY.slice(0,4)}-${String(months.indexOf(match[2])+1).padStart(2,'0')}-${match[1].padStart(2,'0')}T${match[4] || '00:00'}`
}
export function postOrder<T extends Dated & { status: string; updatedAt?: string }>(a: T, b: T) {
  if (a.status !== b.status) return a.status === 'draft' ? -1 : 1
  return a.status === 'scheduled' ? chronological(a,b) : (b.updatedAt || '').localeCompare(a.updatedAt || '')
}
