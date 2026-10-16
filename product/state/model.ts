import {tr, localeTag} from '../i18n'
import {checkBookingRules,type BookingRules} from './bookingRules'
export type Client = {
  id: string; name: string; birthDate: string; birthTime: string; birthPlace: string;
  unknownTime: boolean; request: string; notes: string; updatedAt: string;
  email?: string; phone?: string; telegram?: string; tags?: string[]; stage?: string;
};
export type Appointment = {
  id: string; clientId: string; date: string; time: string; duration: number; title: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  serviceId?: string; price?: number; outcome?: string; meetingUrl?:string; attendance?:'no-show';
  cancellation?: {kind:'cancel'|'no-show'; policy:'free'|'partial'|'hold'|'reschedule'; refundPercent:number; reason:string; recordedAt:string};
};
export type Practice = {
  version: 1; profile: { name: string; timeZone: string }; clients: Client[];
  appointments: Appointment[]; isExample: boolean; onboarded: boolean; bookingRules?:BookingRules; clientStages?:Array<{id:string;label:string}>;
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
  if (!nonempty(input.name)) throw new Error(tr("Укажите имя клиента.","Enter the client's name."));
  validateContacts(input);
  if (typeof input.birthDate !== 'string' || (input.birthDate && !validDate(input.birthDate))) throw new Error(tr("Проверьте дату рождения.","Check the birth date."));
  if (typeof input.birthTime !== 'string' || (!input.unknownTime && input.birthTime && !validTime(input.birthTime))) throw new Error(tr("Проверьте время рождения.","Check the birth time."));
  if (typeof input.unknownTime !== 'boolean' || [input.birthPlace, input.request, input.notes].some(v => typeof v !== 'string')) throw new Error(tr("Проверьте данные клиента.","Check the client's details."));
}

function validateAppointment(input: Omit<Appointment, 'id' | 'status'>): void {
  if (!nonempty(input.clientId)) throw new Error(tr("Выберите клиента.","Choose a client."));
  if (!validDate(input.date)) throw new Error(tr("Укажите корректную дату записи.","Enter a valid appointment date."));
  if (!validTime(input.time)) throw new Error(tr("Укажите корректное время записи.","Enter a valid appointment time."));
  if (!Number.isInteger(input.duration) || input.duration <= 0 || minutes(input.time) + input.duration > 1440) throw new Error(tr("Укажите длительность в пределах выбранного дня.","Choose a duration that fits within the selected day."));
  if (!nonempty(input.title)) throw new Error(tr("Укажите название консультации.","Enter a consultation title."));
  if (input.serviceId !== undefined && !nonempty(input.serviceId)) throw new Error(tr("Выберите услугу или консультацию без услуги.","Choose a service or a consultation without a service."));
  if (input.price !== undefined && (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0)) throw new Error(tr("Стоимость должна быть числом от нуля.","The price must be a number greater than or equal to zero."));
  if (input.outcome !== undefined && typeof input.outcome !== 'string') throw new Error(tr("Введите текст итога встречи.","Enter the appointment outcome."));
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
    const name = practice.clients.find(client => client.id === conflict.clientId)?.name || tr("Другой клиент","Another client");
    throw new Error(tr(`Это время уже занято: ${name}, ${conflict.time}, ${conflict.duration} мин. Выберите другое время консультации.`, `This time is already booked: ${name}, ${conflict.time}, ${conflict.duration} min. Choose another appointment time.`));
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
    new Intl.DateTimeFormat(localeTag(), { timeZone: value.profile.timeZone });
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
  if (!practice.clients.some(c => c.id === input.clientId)) throw new Error(tr("Клиент не найден. Выберите клиента из вашей практики.","Client not found. Choose a client from your practice."));
  ensureAvailable(practice, input);
  checkBookingRules(practice,input);
  return { ...practice, appointments: [...practice.appointments, { ...input, title: input.title.trim(), id: newId(), status: 'confirmed' }] };
}

export function updateClientDetails(practice: Practice, id: string, input: Pick<Client, 'name' | 'request' | 'email' | 'phone' | 'telegram' | 'tags' | 'stage'>): Practice {
  if (!practice.clients.some(c => c.id === id)) throw new Error(tr("Клиент не найден.","Client not found."));
  if (!nonempty(input.name)) throw new Error(tr("Укажите имя клиента.","Enter the client's name."));
  if (typeof input.request !== 'string') throw new Error(tr("Введите запрос клиента.","Enter the client's request."));
  validateContacts(input);
  return { ...practice, clients: practice.clients.map(c => c.id === id ? { ...c, ...input, name: input.name.trim(), request: input.request.trim(), updatedAt: new Date().toISOString() } : c) };
}

export function rescheduleAppointment(practice: Practice, id: string, input: Omit<Appointment, 'id' | 'status' | 'clientId'>): Practice {
  const appointment = practice.appointments.find(a => a.id === id);
  if (!appointment) throw new Error(tr("Запись не найдена.","Appointment not found."));
  if (appointment.status !== 'confirmed') throw new Error(tr("Перенести можно только запланированную встречу.","Only scheduled appointments can be rescheduled."));
  const details = { clientId: appointment.clientId, date: input.date, time: input.time, duration: input.duration, title: input.title,
    ...(Object.prototype.hasOwnProperty.call(input, 'serviceId') ? { serviceId: input.serviceId } : appointment.serviceId ? { serviceId: appointment.serviceId } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'price') ? { price: input.price } : appointment.price !== undefined ? { price: appointment.price } : {}) };
  validateAppointment(details);
  ensureAvailable(practice, details, id);
  checkBookingRules(practice,details,id);
  return { ...practice, appointments: practice.appointments.map(a => a.id === id ? { ...a, ...details, title: details.title.trim() } : a) };
}

/** Restore the same cancelled record at a new time without losing its payment link. */
export function restoreAppointmentAt(practice: Practice, id: string, input: Omit<Appointment, 'id' | 'status' | 'clientId'>): Practice {
  const appointment = practice.appointments.find(a => a.id === id);
  if (!appointment) throw new Error(tr("Запись не найдена.","Appointment not found."));
  if (appointment.status !== 'cancelled') throw new Error(tr("Восстановить можно только отменённую встречу.","Only cancelled appointments can be restored."));
  const restored: Practice = { ...practice, appointments: practice.appointments.map(a => a.id === id ? { ...a, status: 'confirmed', attendance: undefined } : a) };
  return rescheduleAppointment(restored, id, input);
}

export function saveClientNotes(practice: Practice, id: string, notes: string): Practice {
  if (!practice.clients.some(c => c.id === id)) throw new Error(tr("Клиент не найден.","Client not found."));
  if (typeof notes !== 'string') throw new Error(tr("Введите текст заметки.","Enter the note text."));
  return { ...practice, clients: practice.clients.map(c => c.id === id ? { ...c, notes, updatedAt: new Date().toISOString() } : c) };
}

export function setAppointmentStatus(practice: Practice, id: string, status: Appointment['status']): Practice {
  const appointment = practice.appointments.find(a => a.id === id);
  if (!appointment) throw new Error(tr("Запись не найдена.","Appointment not found."));
  if (!validStatus(status)) throw new Error(tr("Выберите корректный статус записи.","Choose a valid appointment status."));
  if (status !== 'cancelled') ensureAvailable(practice, appointment, id);
  if (status === 'confirmed') checkBookingRules(practice, appointment, id);
  return { ...practice, appointments: practice.appointments.map(a => a.id === id ? { ...a, status, ...(status === 'confirmed' ? {attendance: undefined} : {}) } : a) };
}


/** An outcome belongs to this consultation, never to the client's unrelated notes. */
export function completeAppointment(practice: Practice, id: string, outcome: string): Practice {
  const appointment = practice.appointments.find(a => a.id === id);
  if (!appointment) throw new Error(tr("Встреча не найдена.","Appointment not found."));
  if (appointment.status === 'cancelled') throw new Error(tr("Нельзя завершить отменённую встречу. Сначала восстановите запись.","A cancelled appointment cannot be completed. Restore it first."));
  if (typeof outcome !== 'string') throw new Error(tr("Введите текст итога встречи.","Enter the appointment outcome."));
  ensureAvailable(practice, appointment, id);
  return { ...practice, appointments: practice.appointments.map(a => a.id === id ? { ...a, status: 'completed', outcome: outcome.trim() } : a) };
}

export function formatDate(date: string): string {
  return validDate(date) ? new Intl.DateTimeFormat(localeTag(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)) : '—';
}

function validateContacts(input:Partial<Client>){
 if(input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))throw new Error(tr('Проверьте электронную почту.','Check the email address.'));
 if(input.stage && (typeof input.stage!=='string'||input.stage.length>80))throw new Error(tr('Выберите этап работы.','Choose a client stage.'));
 if(input.tags && (!Array.isArray(input.tags)||input.tags.some(t=>typeof t!=='string')))throw new Error(tr('Проверьте метки клиента.','Check client tags.'));
 for(const k of ['email','phone','telegram'] as const)if(input[k]!==undefined&&typeof input[k]!=='string')throw new Error(tr('Проверьте контакты клиента.','Check client contact details.'));
}
export function saveMeetingUrl(practice:Practice,id:string,url:string){
 const value=url.trim();
 if(value){let parsed:URL;try{parsed=new URL(value)}catch{throw new Error(tr('Введите полную ссылку https://…','Enter a complete https://… link.'))}if(parsed.protocol!=='https:')throw new Error(tr('Ссылка должна начинаться с https://','The link must start with https://'));}
 if(!practice.appointments.some(a=>a.id===id))throw new Error(tr('Встреча не найдена.','Appointment not found.'));
 return {...practice,appointments:practice.appointments.map(a=>a.id===id?{...a,meetingUrl:value}:a)};
}
export function markNoShow(practice:Practice,id:string){
 const a=practice.appointments.find(a=>a.id===id);
 if(!a||a.status!=='confirmed'||a.date>TODAY)throw new Error(tr('Неявку можно отметить у состоявшейся по расписанию встречи.','No-shows can only be recorded for scheduled appointments that are due.'));
 return {...practice,appointments:practice.appointments.map(a=>a.id===id?{...a,status:'cancelled' as const,attendance:'no-show' as const}:a)};
}
export function appointmentStatusLabel(a:Appointment){return a.attendance==='no-show'&&a.status==='cancelled'?tr('Неявка','No-show'):a.status==='completed'?tr('Завершена','Completed'):a.status==='cancelled'?tr('Отменена','Cancelled'):tr('Запланирована','Scheduled')}

/** Records the cancellation agreement only. Payment/refund execution is a separate operation. */
export function recordCancellation(practice:Practice,id:string,decision:NonNullable<Appointment['cancellation']>):Practice {
 const a=practice.appointments.find(item=>item.id===id);
 if(!a||a.status!=='confirmed')throw new Error(tr('Отменить можно только запланированную встречу.','Only scheduled appointments can be cancelled.'));
 if(!['free','partial','hold','reschedule'].includes(decision.policy)||!Number.isFinite(decision.refundPercent)||decision.refundPercent<0||decision.refundPercent>100||!decision.reason.trim()||!Number.isFinite(Date.parse(decision.recordedAt)))throw new Error(tr('Укажите условия и причину отмены.','Specify the cancellation terms and reason.'));
 const next=decision.kind==='no-show'?markNoShow(practice,id):setAppointmentStatus(practice,id,'cancelled');
 return {...next,appointments:next.appointments.map(item=>item.id===id?{...item,cancellation:{...decision,reason:decision.reason.trim()}}:item)};
}
