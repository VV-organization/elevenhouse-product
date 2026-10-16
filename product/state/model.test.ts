import { describe, expect, it } from 'vitest';
import { addAppointment, addClient, createEmptyPractice, createExamplePractice, formatDate, parsePractice, saveClientNotes, setAppointmentStatus, updateClientDetails, rescheduleAppointment, TODAY } from './model';

const clientInput = { name: 'Новый клиент', birthDate: '', birthTime: '', birthPlace: '', unknownTime: true, request: 'Выбор направления', notes: '' };
const session = { clientId: 'marina', date: TODAY, time: '11:30', duration: 60, title: 'Консультация' };

describe('practice state', () => {
  it('starts empty, separate from an onboarding-ready example', () => {
    const mine = createEmptyPractice('Анна');
    const example = createExamplePractice('Анна');
    expect(mine).toMatchObject({ version: 1, profile: { name: 'Анна' }, clients: [], appointments: [], isExample: false, onboarded: false });
    expect(example).toMatchObject({ isExample: true, onboarded: true });
    expect(example.clients.length).toBeGreaterThanOrEqual(3);
    expect(example.appointments.map(a => a.time)).toEqual(['11:00', '14:00', '16:30']);
    expect(example.appointments.every(a => a.date === TODAY)).toBe(true);
    expect(example.clients.find(c => c.id === 'marina')).toMatchObject({ birthDate: '1990-03-14', birthTime: '08:25', birthPlace: 'Москва' });
  });

  it('retains notes on the correct client through JSON restoration', () => {
    const original = createExamplePractice();
    const before = JSON.stringify(original);
    const changed = saveClientNotes(original, 'marina', 'Обсудить новую работу');
    const restored = parsePractice(JSON.stringify(changed))!;
    expect(restored.clients.find(c => c.id === 'marina')).toMatchObject({ notes: 'Обсудить новую работу', birthDate: '1990-03-14' });
    expect(restored.appointments.find(a => a.time === '11:00')?.clientId).toBe('marina');
    expect(restored.clients.filter(c => c.id !== 'marina')).toEqual(original.clients.filter(c => c.id !== 'marina'));
    expect(JSON.stringify(original)).toBe(before);
    expect(createExamplePractice()).toEqual(original);
  });

  it('accepts a client without birth data and clears unknown birth time', () => {
    const original = createEmptyPractice('Анна');
    const updated = addClient(original, { ...clientInput, birthTime: '15:30' });
    expect(updated.clients[0]).toMatchObject({ name: 'Новый клиент', birthTime: '', unknownTime: true, request: clientInput.request });
    expect(updated.clients[0].id).toBeTruthy();
    expect(updated.clients[0].updatedAt).toBeTruthy();
    expect(original.clients).toEqual([]);
    expect(parsePractice(JSON.stringify(updated))).toEqual(updated);
  });

  it('rejects invalid names, impossible dates and malformed birth times', () => {
    const p = createEmptyPractice('Анна');
    expect(() => addClient(p, { ...clientInput, name: ' ' })).toThrow(/имя/i);
    expect(() => addClient(p, { ...clientInput, birthDate: '2026-02-30' })).toThrow(/дат/i);
    expect(() => addClient(p, { ...clientInput, unknownTime: false, birthTime: '29:00' })).toThrow(/врем/i);
  });

  it('rejects overlapping active sessions but permits touching boundaries and other days', () => {
    const p = createExamplePractice();
    expect(() => addAppointment(p, session)).toThrow(/врем|занят|пересек/i);
    expect(() => addAppointment(p, session)).toThrow(/Марина.*11:00.*60 мин/);
    expect(() => addAppointment(p, { ...session, time: '10:30' })).toThrow();
    const next = addAppointment(p, { ...session, time: '12:00' });
    expect(next.appointments.at(-1)).toMatchObject({ ...session, time: '12:00', status: 'confirmed' });
    expect(addAppointment(p, { ...session, date: '2026-10-16' }).appointments).toHaveLength(4);
    expect(p.appointments).toHaveLength(3);
  });

  it('allows cancelled-slot reuse and rejects restoring a conflicting cancelled session', () => {
    const p = createExamplePractice();
    const id = p.appointments[0].id;
    const cancelled = setAppointmentStatus(p, id, 'cancelled');
    const booked = addAppointment(cancelled, session);
    expect(booked.appointments).toHaveLength(4);
    expect(p.appointments[0].status).toBe('confirmed');
    expect(() => setAppointmentStatus(booked, id, 'confirmed')).toThrow(/врем|занят|пересек/i);
    expect(setAppointmentStatus(p, id, 'completed').appointments[0].status).toBe('completed');
  });

  it('rejects missing client context and invalid session fields', () => {
    const p = createExamplePractice();
    expect(() => addAppointment(p, { ...session, clientId: 'missing' })).toThrow(/клиент/i);
    expect(() => saveClientNotes(p, 'missing', 'Запись')).toThrow(/клиент/i);
    expect(() => setAppointmentStatus(p, 'missing', 'completed')).toThrow(/запис/i);
    for (const input of [{ date: '2026-02-30' }, { time: '25:00' }, { duration: 0 }, { duration: -1 }, { duration: NaN }, { title: '' }, { time: '23:30', duration: 60 }]) {
      expect(() => addAppointment(p, { ...session, ...input })).toThrow();
    }
  });

  it('rejects corrupt persisted data instead of restoring partial or orphaned state', () => {
    for (const value of [null, '', '{', '{}', 'null', '[]']) expect(parsePractice(value)).toBeNull();
    const p = createExamplePractice();
    const corruptions = [
      { ...p, version: 2 }, { ...p, profile: { name: 'Анна' } }, { ...p, isExample: 'yes' }, { ...p, onboarded: null },
      { ...p, clients: [{ ...p.clients[0], name: '' }] },
      { ...p, clients: [{ ...p.clients[0], unknownTime: 'yes' }] },
      { ...p, clients: [{ ...p.clients[0], birthDate: '1990-02-31' }] },
      { ...p, clients: [...p.clients, p.clients[0]] },
      { ...p, appointments: [{ ...p.appointments[0], clientId: 'missing' }] },
      { ...p, appointments: [{ ...p.appointments[0], status: 'pending' }] },
      { ...p, appointments: [{ ...p.appointments[0], duration: '60' }] },
      { ...p, appointments: [...p.appointments, p.appointments[0]] },
    ];
    for (const corrupted of corruptions) expect(parsePractice(JSON.stringify(corrupted))).toBeNull();
  });

  it('formats date-only input in Russian without timezone shifts', () => {
    expect(formatDate('1990-03-14')).toMatch(/14 марта/);
    expect(formatDate(TODAY)).toMatch(/15 октября/);
    expect(formatDate('')).toBe('—');
  });
});


describe('editing an existing practice', () => {
  it('updates client details without losing birth data, notes or linked appointments', () => {
    const original = createExamplePractice();
    const before = JSON.stringify(original);
    const changed = updateClientDetails(original, 'marina', { name: '  Марина Петрова  ', request: '  Новый запрос  ' });
    const client = changed.clients.find(c => c.id === 'marina')!;
    expect(client).toMatchObject({ ...original.clients[0], name: 'Марина Петрова', request: 'Новый запрос', updatedAt: expect.any(String) });
    expect(changed.clients[1]).toBe(original.clients[1]);
    expect(changed.appointments).toEqual(original.appointments);
    expect(parsePractice(JSON.stringify(changed))).toEqual(changed);
    expect(JSON.stringify(original)).toBe(before);
    expect(updateClientDetails(changed, 'marina', { name: 'Марина', request: '' }).clients[0].request).toBe('');
  });

  it('rejects invalid client edits or missing clients', () => {
    const p = createExamplePractice();
    expect(() => updateClientDetails(p, 'missing', { name: 'Анна', request: '' })).toThrow(/клиент/i);
    expect(() => updateClientDetails(p, 'marina', { name: ' ', request: '' })).toThrow(/имя/i);
    expect(() => updateClientDetails(p, 'marina', { name: 'Марина', request: null as unknown as string })).toThrow(/запрос/i);
  });

  it('reschedules in place, ignoring its own old interval and keeping its client and identifier', () => {
    const p = createExamplePractice();
    const before = JSON.stringify(p);
    const changed = rescheduleAppointment(p, 'session-marina', { date: TODAY, time: '11:30', duration: 90, title: '  Обновлённая встреча  ' });
    expect(changed.appointments).toHaveLength(3);
    expect(changed.appointments[0]).toEqual({ ...p.appointments[0], time: '11:30', duration: 90, title: 'Обновлённая встреча' });
    expect(changed.appointments[1]).toBe(p.appointments[1]);
    expect(changed.clients).toBe(p.clients);
    expect(parsePractice(JSON.stringify(changed))).toEqual(changed);
    expect(JSON.stringify(p)).toBe(before);
    expect(rescheduleAppointment(p, 'session-marina', { date: TODAY, time: '13:00', duration: 60, title: 'Встреча' }).appointments[0].time).toBe('13:00');
  });

  it('rejects occupied intervals without changing the original appointment', () => {
    const p = createExamplePractice();
    const input = { date: TODAY, time: '13:30', duration: 60, title: 'Встреча' };
    expect(() => rescheduleAppointment(p, 'session-marina', input)).toThrow(/занято/i);
    expect(p.appointments[0].time).toBe('11:00');
    const cancelled = setAppointmentStatus(p, 'session-dmitry', 'cancelled');
    expect(rescheduleAppointment(cancelled, 'session-marina', input).appointments[0].time).toBe('13:30');
    expect(rescheduleAppointment(p, 'session-marina', { ...input, date: '2026-10-16' }).appointments[0].date).toBe('2026-10-16');
  });

  it('allows rescheduling only planned appointments and validates new fields', () => {
    const p = createExamplePractice();
    const input = { date: TODAY, time: '12:00', duration: 60, title: 'Встреча' };
    expect(() => rescheduleAppointment(p, 'missing', input)).toThrow(/запис/i);
    for (const status of ['cancelled', 'completed'] as const) {
      expect(() => rescheduleAppointment(setAppointmentStatus(p, 'session-marina', status), 'session-marina', input)).toThrow(/запланирован/i);
    }
    for (const patch of [{ date: '2026-02-30' }, { time: '25:00' }, { duration: 0 }, { duration: 1.5 }, { title: ' ' }, { time: '23:30', duration: 60 }]) {
      expect(() => rescheduleAppointment(p, 'session-marina', { ...input, ...patch })).toThrow();
    }
  });
});
