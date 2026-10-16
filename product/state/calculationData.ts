import {TODAY, type Client} from './model'

export type BirthData = Pick<Client, 'birthDate' | 'birthTime' | 'birthPlace' | 'unknownTime'>
export const emptyBirthData: BirthData = {birthDate: '', birthTime: '', birthPlace: '', unknownTime: false}
export function birthDataOf(client: BirthData): BirthData {
  return {birthDate: client.birthDate, birthTime: client.unknownTime ? '' : client.birthTime, birthPlace: client.birthPlace, unknownTime: client.unknownTime}
}
export function birthDataError(data: BirthData): string {
  const date = new Date(`${data.birthDate}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.birthDate) return 'Укажите корректную дату рождения.'
  if (data.birthDate > TODAY) return 'Дата рождения не может быть в будущем.'
  if (!data.birthPlace.trim()) return 'Укажите город и страну рождения.'
  if (!data.unknownTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.birthTime)) return 'Укажите время рождения или отметьте «Время неизвестно».'
  return ''
}
export function hasSavedNatalChart(client: Client | undefined, isExample: boolean): boolean {
  return !!client && isExample && client.id === 'marina' && client.name.trim().split(/\s+/)[0] === 'Марина' && client.birthDate === '1990-03-14' && client.birthTime === '08:25' && client.birthPlace.trim() === 'Москва' && !client.unknownTime
}

export type BirthDraft = {data: BirthData; source: BirthData}
export function sameBirthData(left: BirthData, right: BirthData): boolean {
  return left.birthDate === right.birthDate && left.birthTime === right.birthTime && left.birthPlace === right.birthPlace && left.unknownTime === right.unknownTime
}
export function resolveBirthDraft(source: BirthData, saved?: BirthDraft) {
  const changed = !!saved && !sameBirthData(saved.data, source)
  const conflict = changed && !sameBirthData(saved!.source, source)
  return {data: changed && !conflict ? saved!.data : source, restored: changed && !conflict, conflict}
}
