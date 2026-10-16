export type Client = {
  id: string; name: string; birthDate: string; birthTime: string; birthPlace: string;
  unknownTime: boolean; request: string; notes: string; updatedAt: string;
};
export type Appointment = {
  id: string; clientId: string; date: string; time: string; duration: number; title: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  serviceId?: string; price?: number; outcome?: string;
};
export type Practice = {
  version: 1; profile: { name: string; timeZone: string }; clients: Client[];
  appointments: Appointment[]; isExample: boolean; onboarded: boolean;
};

export const TODAY = '2026-10-15';

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function minutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

function validateClient(input: Omit<Client, 'id' | 'updatedAt'>): void {
  if (!nonempty(input.name)) throw new Error('Укажите имя клиента.');
  if (typeof input.birthDate !== 'string' || (input.birthDate && !validDate(input.birthDate))) throw new Error('Проверьте дату рождения.');
  if (typeof input.birthTime !== 'string' || (!input.unknownTime && input.birthTime && !validTime(input.birthTime))) throw new Error('Проверьте время рождения.');
  if (typeof input.unknownTime !== 'boolean' || [input.birthPlace, input.request, input.notes].some(v => typeof v !== 'string')) throw new Error('Проверьте данные клиента.');
}

function validateAppointment(input: Omit<Appointment, 'id' | 'status'>): void {
  if (!nonempty(input.clientId)) throw new Error('Выберите клиента.');
  if (!validDate(input.date)) throw new Error('Укажите корректную дату записи.');
  if (!validTime(input.time)) throw new Error('Укажите корректное время записи.');
  if (!Number.isInteger(input.duration) || input.duration <= 0 || minutes(input.time) + input.duration > 1440) throw new Error('Укажите длительность в пределах выбранного дня.');
  if (!nonempty(input.title)) throw new Error('Укажите название консультации.');
  if (input.serviceId !== undefined && !nonempty(input.serviceId)) throw new Error('Выберите услугу или консультацию без услуги.');
  if (input.price !== undefined && (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0)) throw new Error('Стоимость должна быть числом от нуля.');
  if (input.outcome !== undefined && typeof input.outcome !== 'string') throw new Error('Введите текст итога встречи.');
}

function validStatus(value: unknown): value is Appointment['status'] {
  return value === 'confirmed' || value === 'completed' || value === 'cancelled';
}

function overlaps(a: Pick<Appointment, 'date' | 'time' | 'duration'>, b: Appointment): boolean {
  return a.date === b.date && minutes(a.time) < minutes(b.time) + b.duration && minutes(b.time) < minutes(a.time) + a.duration;
}

function ensureAvailable(practice: Practice, input: Omit<Appointment, 'id' | 'status'>, exceptId?: string): void {
  const conflict = practice.appointments.find(a => a.id !== exceptId && a.status !== 'cancelled' && overlaps(input, a));
  if (conflict) {
    const name = practice.clients.find(client => client.id === conflict.clientId)?.name || 'Другой клиент';
    throw new Error(`Это время уже занято: ${name}, ${conflict.time}, ${conflict.duration} мин. Выберите другое время консультации.`);
  }
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createEmptyPractice(name: string): Practice {
  return { version: 1, profile: { name: name.trim() || 'Моя практика', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow' }, clients: [], appointments: [], isExample: false, onboarded: false };
}

export function createExamplePractice(name = 'Анна'): Practice {
  const updatedAt = '2026-10-14T12:00:00.000Z';
  return {
    ...createEmptyPractice(name), isExample: true, onboarded: true,
    clients: [
      { id: 'marina', name: 'Марина Иванова', birthDate: '1990-03-14', birthTime: '08:25', birthPlace: 'Москва', unknownTime: false, request: 'Смена работы и профессиональное направление', notes: 'На встрече обсудим переход к новой роли и ближайшие шаги.', updatedAt },
      { id: 'dmitry', name: 'Дмитрий Петров', birthDate: '1987-07-22', birthTime: '', birthPlace: 'Екатеринбург', unknownTime: true, request: 'Баланс работы и личных планов', notes: 'Время рождения пока неизвестно.', updatedAt },
      { id: 'olga', name: 'Ольга Смирнова', birthDate: '1994-11-05', birthTime: '16:10', birthPlace: 'Санкт-Петербург', unknownTime: false, request: 'Итоги сопровождения и следующий месяц', notes: 'Вернуться к целям, которые определили на прошлой встрече.', updatedAt },
    ],
    appointments: [
      { id: 'session-marina', clientId: 'marina', date: TODAY, time: '11:00', duration: 60, title: 'Профессиональное направление', status: 'confirmed' },
      { id: 'session-dmitry', clientId: 'dmitry', date: TODAY, time: '14:00', duration: 60, title: 'Первая консультация', status: 'confirmed' },
      { id: 'session-olga', clientId: 'olga', date: TODAY, time: '16:30', duration: 45, title: 'Встреча сопровождения', status: 'confirmed' },
    ],
  };
}

export function parsePractice(raw: string | null): Practice | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1 || !record(value.profile) || !nonempty(value.profile.name) || !nonempty(value.profile.timeZone)
      || typeof value.isExample !== 'boolean' || typeof value.onboarded !== 'boolean' || !Array.isArray(value.clients) || !Array.isArray(value.appointments)) return null;
    // Reject timezone identifiers that cannot be used by date renderers.
    new Intl.DateTimeFormat('ru-RU', { timeZone: value.profile.timeZone });
    const clientIds = new Set<string>();
    for (const client of value.clients) {
      if (!record(client) || !nonempty(client.id) || clientIds.has(client.id) || typeof client.updatedAt !== 'string' || !Number.isFinite(Date.parse(client.updatedAt))) return null;
      validateClient(client as Client);
      if (client.unknownTime && client.birthTime !== '') return null;
      clientIds.add(client.id);
    }
    const appointmentIds = new Set<string>();
    for (const appointment of value.appointments) {
      if (!record(appointment) || !nonempty(appointment.id) || appointmentIds.has(appointment.id) || !validStatus(appointment.status)) return null;
      validateAppointment(appointment as Appointment);
      if (!clientIds.has(appointment.clientId as string)) return null;
      appointmentIds.add(appointment.id);
    }
    const practice = value as Practice;
    for (const appointment of practice.appointments) {
      if (appointment.status !== 'cancelled') ensureAvailable(practice, appointment, appointment.id);
    }
    return practice;
  } catch {
    return null;
  }
}

export function addClient(practice: Practice, input: Omit<Client, 'id' | 'updatedAt'>): Practice {
  validateClient(input);
  const client: Client = { ...input, name: input.name.trim(), birthTime: input.unknownTime ? '' : input.birthTime, id: newId(), updatedAt: new Date().toISOString() };
  return { ...practice, clients: [...practice.clients, client] };
}

export function addAppointment(practice: Practice, input: Omit<Appointment, 'id' | 'status'>): Practice {
  validateAppointment(input);
  if (!practice.clients.some(c => c.id === input.clientId)) throw new Error('Клиент не найден. Выберите клиента из вашей практики.');
  ensureAvailable(practice, input);
  return { ...practice, appointments: [...practice.appointments, { ...input, title: input.title.trim(), id: newId(), status: 'confirmed' }] };
}

export function updateClientDetails(practice: Practice, id: string, input: Pick<Client, 'name' | 'request'>): Practice {
  if (!practice.clients.some(c => c.id === id)) throw new Error('Клиент не найден.');
  if (!nonempty(input.name)) throw new Error('Укажите имя клиента.');
  if (typeof input.request !== 'string') throw new Error('Введите запрос клиента.');
  return { ...practice, clients: practice.clients.map(c => c.id === id ? { ...c, name: input.name.trim(), request: input.request.trim(), updatedAt: new Date().toISOString() } : c) };
}

export function rescheduleAppointment(practice: Practice, id: string, input: Omit<Appointment, 'id' | 'status' | 'clientId'>): Practice {
  const appointment = practice.appointments.find(a => a.id === id);
  if (!appointment) throw new Error('Запись не найдена.');
  if (appointment.status !== 'confirmed') throw new Error('Перенести можно только запланированную встречу.');
  const details = { clientId: appointment.clientId, date: input.date, time: input.time, duration: input.duration, title: input.title,
    ...(Object.prototype.hasOwnProperty.call(input, 'serviceId') ? { serviceId: input.serviceId } : appointment.serviceId ? { serviceId: appointment.serviceId } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'price') ? { price: input.price } : appointment.price !== undefined ? { price: appointment.price } : {}) };
  validateAppointment(details);
  ensureAvailable(practice, details, id);
  return { ...practice, appointments: practice.appointments.map(a => a.id === id ? { ...a, ...details, title: details.title.trim() } : a) };
}

export function saveClientNotes(practice: Practice, id: string, notes: string): Practice {
  if (!practice.clients.some(c => c.id === id)) throw new Error('Клиент не найден.');
  if (typeof notes !== 'string') throw new Error('Введите текст заметки.');
  return { ...practice, clients: practice.clients.map(c => c.id === id ? { ...c, notes, updatedAt: new Date().toISOString() } : c) };
}

export function setAppointmentStatus(practice: Practice, id: string, status: Appointment['status']): Practice {
  const appointment = practice.appointments.find(a => a.id === id);
  if (!appointment) throw new Error('Запись не найдена.');
  if (!validStatus(status)) throw new Error('Выберите корректный статус записи.');
  if (status !== 'cancelled') ensureAvailable(practice, appointment, id);
  return { ...practice, appointments: practice.appointments.map(a => a.id === id ? { ...a, status } : a) };
}


/** An outcome belongs to this consultation, never to the client's unrelated notes. */
export function completeAppointment(practice: Practice, id: string, outcome: string): Practice {
  const appointment = practice.appointments.find(a => a.id === id);
  if (!appointment) throw new Error('Встреча не найдена.');
  if (appointment.status === 'cancelled') throw new Error('Нельзя завершить отменённую встречу. Сначала восстановите запись.');
  if (typeof outcome !== 'string') throw new Error('Введите текст итога встречи.');
  ensureAvailable(practice, appointment, id);
  return { ...practice, appointments: practice.appointments.map(a => a.id === id ? { ...a, status: 'completed', outcome: outcome.trim() } : a) };
}

export function formatDate(date: string): string {
  return validDate(date) ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)) : '—';
}
