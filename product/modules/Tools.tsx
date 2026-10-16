import {ClientPicker} from '../components/ClientPicker'
import {LearningTip, useLearning} from '../components/Learning'
import {reminderOrder} from '../state/ordering'
import {clientJournalEntries, type JournalEntry as Entry} from '../state/journalEntries'
import { useEffect, useState, type FormEvent } from 'react'
import { CalculationWorkspace } from '../components/CalculationWorkspace'
import { Dialog } from '../components/Dialog'
import { useFormExit } from '../components/useFormExit'
import { Icon } from '../components/Icon'
import { TODAY, formatDate, type Client, type Practice } from '../state/model'
import { EmptyState, Notice, SectionHeader, countLabel, useModuleState, type ModuleProps } from './ModuleKit'

type Section = 'tools' | 'journal' | 'astro-calendar' | 'library'
type Reminder = { id: string; eventId: string; clientId: string; date: string; time: string; text: string; done: boolean }
type Material = { id: string; title: string; category: string; text: string; updated: string }
type CalendarEvent = { id: string; clientId: string; date: string; time: string; title: string; type: 'birthday' | 'appointment' }
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
const categories = ['Подготовка к встрече', 'Трактовки', 'Практики', 'Другое']
function NoClients() { return <EmptyState icon="clients" title="Сначала добавьте клиента" action={<a className="ep-button ep-button--primary" href="#clients">Перейти к клиентам</a>}>Укажите имя и фамилию. Данные рождения и запрос можно добавить позже.</EmptyState> }
function StorageNotice({ failed }: { failed: boolean }) { return failed ? <Notice error>Не удалось сохранить изменения. Скопируйте важный текст перед закрытием страницы.</Notice> : null }
function validDate(date: string) { return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date }
function dateStamp() { return new Date().toISOString() }
function birthdayAfter(birth: string) { if (!birth) return ''; const monthDay = birth.slice(5); let year = Number(TODAY.slice(0, 4)); let result = `${year}-${monthDay}`; if (result < TODAY) result = `${++year}-${monthDay}`; while (!validDate(result)) result = `${++year}-${monthDay}`; return result }

export function Tools({ section, ...props }: ModuleProps & { section: Section; onChange?: (practice: Practice) => void }) {
  return <div className="ex-module">{section === 'tools' ? <Calculations {...props} /> : section === 'journal' ? <Journal {...props} /> : section === 'astro-calendar' ? <PersonalCalendar {...props} /> : <Library {...props} />}</div>
}

function Calculations(props: ModuleProps & {onChange?: (practice: Practice) => void}) {
  return <><SectionHeader title="Расчёты"/><CalculationWorkspace {...props}/></>
}

function initialEntries(example: boolean): Entry[] {
  return example ? [
    { id: 'j1', clientId: 'marina', date: '2026-10-13', time: '19:30', author: 'client', kind: 'note', text: 'Поговорила с руководителем о новой роли. Хочу обсудить, как подготовиться к следующей встрече.' },
    { id: 'j2', clientId: 'marina', date: '2026-10-13', time: '20:15', author: 'specialist', kind: 'reply', text: 'На консультации разберём ваши ожидания. До встречи запишите, что в новой роли привлекает и что вызывает сомнения.' },
    { id: 'j3', clientId: 'olga', date: '2026-10-14', time: '18:00', author: 'client', kind: 'note', text: 'Записала итоги месяца. На встрече хочу выбрать одну цель на следующие четыре недели.' },
  ] : []
}
export function Journal({practice, onOpenClient, clientId: fixedClientId, onOpenAppointment}: ModuleProps & {clientId?: string; onOpenAppointment?: (id:string)=>void}) {
  const learning=useLearning()
  const [entries, setEntries, failed] = useModuleState<Entry[]>('journal', practice.isExample, () => initialEntries(practice.isExample))
  const [selectedId, setSelectedId] = useModuleState<string>('journal-client', practice.isExample, () => practice.clients[0]?.id || '')
  const clientId = fixedClientId || selectedId
  const [compose, setCompose] = useState(false), [message, setMessage] = useState(''), [visibleCount, setVisibleCount] = useState(4)
  useEffect(() => {setVisibleCount(4);setMessage('')}, [clientId])
  const client = practice.clients.find(item => item.id === clientId)
  const newestEntries = clientJournalEntries(entries, practice.appointments, clientId)
  function openAppointment(id:string) {
    if (onOpenAppointment) return onOpenAppointment(id)
    const url=new URL(location.href);url.searchParams.set('appointment',id);history.replaceState(null,'',url);onOpenClient(clientId)
  }
  function openMessages() {
    const url = new URL(location.href); url.searchParams.set('conversation', clientId); url.hash='messages'; location.href=url.toString()
  }
  return <div className="ex-journal">{!fixedClientId && <LearningTip topic="journal"/>}{!fixedClientId && <SectionHeader title="Заметки и итоги" action={client && <button className="ep-button ep-button--primary" onClick={() => setCompose(true)}><Icon name="plus" size={18}/>Добавить заметку</button>}/>}<StorageNotice failed={failed}/>
    {!practice.clients.length ? <NoClients/> : <>{!fixedClientId && <div className="ex-toolbar"><ClientPicker clients={practice.clients} value={clientId} onChange={setSelectedId}/>{client && <button className="ep-text-button" onClick={() => onOpenClient(client.id)}>Карточка клиента <Icon name="arrow" size={16}/></button>}</div>}
    {client && <>{fixedClientId&&<h2 className="ex-journal-heading">История записей и встреч</h2>}<div className="ex-toolbar">{fixedClientId && <button className="ep-button" onClick={() => setCompose(true)}>Добавить запись</button>}<button className="ep-text-button" onClick={openMessages}>Переписка с клиентом <Icon name="arrow" size={16}/></button></div>{message && <Notice>{message}</Notice>}
    {newestEntries.length ? <><p className="ep-muted ex-journal-order">Сначала новые записи</p><ol className="ex-timeline" aria-label={`Заметки и итоги: ${client.name}`}>{newestEntries.slice(0,visibleCount).map(entry => <li key={entry.id} className="ex-panel"><div className="ep-section-heading"><strong>{entry.author === 'client' ? client.name : entry.kind === 'reply' ? 'Ваш ответ' : entry.kind === 'summary' ? 'Итог встречи · только вам' : 'Ваша заметка · только вам'}</strong><span className="ep-muted">{formatDate(entry.date)} · {entry.time}</span></div>{entry.appointmentTitle && <p className="ep-muted">{entry.appointmentTitle}{entry.appointmentStatus === 'cancelled' ? ' · Встреча отменена' : entry.appointmentStatus === 'confirmed' ? ' · В плане' : ''}</p>}<p style={{whiteSpace:'pre-wrap'}}>{entry.text}</p>{entry.appointmentId && <button className="ep-text-button" onClick={() => openAppointment(entry.appointmentId!)}>Открыть встречу <Icon name="arrow" size={16}/></button>}{(entry.author === 'client' || entry.kind === 'reply') && <button className="ep-text-button" onClick={openMessages}>Продолжить в сообщениях <Icon name="arrow" size={16}/></button>}</li>)}</ol>{newestEntries.length > visibleCount && <div className="ex-list-more"><button className="ep-button" onClick={() => setVisibleCount(count => count+4)}>Показать ещё {Math.min(4,newestEntries.length-visibleCount)}</button><span className="ep-muted">Показано {Math.min(visibleCount,newestEntries.length)} из {newestEntries.length}</span></div>}</> : fixedClientId ? <p className="ep-empty-line">Здесь появятся отдельные записи и итоги консультаций.</p> : <EmptyState title="Заметок пока нет" action={<button className="ep-button" onClick={() => setCompose(true)}>Добавить заметку</button>}>Здесь можно сохранить личные наблюдения. Итог консультации добавляется из самой встречи.</EmptyState>}
    </>}</>}
    {compose && client && <EntryDialog client={client} onClose={() => setCompose(false)} onSave={text => {const time = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:practice.profile.timeZone}).format(new Date());setEntries(old => [...old,{id:uid(),clientId:client.id,date:TODAY,time,author:'specialist',kind:'note',text}]);learning.complete('journal');setCompose(false);setMessage('Заметка сохранена. Она видна только вам.')}}/>}
  </div>
}
function EntryDialog({client,onSave,onClose}:{client:Client;onSave:(text:string)=>void;onClose:()=>void}) {
  const [text,setText]=useState(''), [error,setError]=useState('')
  const exit=useFormExit(onClose)
  function submit(event:FormEvent){event.preventDefault();if(!text.trim())return setError('Введите текст заметки.');onSave(text.trim())}
  return <Dialog title={`Заметка · ${client.name}`} onClose={exit.close}><form className="ep-form" onSubmit={submit} onInput={exit.changed} onChange={exit.changed}><label>Ваши наблюдения<textarea rows={7} value={text} onChange={event=>setText(event.target.value)} required/></label><p className="ep-muted">Заметка видна только вам. Для ответа клиенту откройте переписку.</p>{error && <Notice error>{error}</Notice>}{exit.warning}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>Отмена</button><button className="ep-button ep-button--primary">Сохранить заметку</button></footer></form></Dialog>
}

function PersonalCalendar({ practice, onOpenClient }: ModuleProps) {
  const learning=useLearning()
  const [reminders, setReminders, failed] = useModuleState<Reminder[]>('reminders', practice.isExample, () => [])
  const [clientId, setClientId] = useModuleState<string>('personal-calendar-client', practice.isExample, () => ''), [tab, setTab] = useModuleState<'events' | 'reminders'>('personal-calendar-tab', practice.isExample, () => 'events'), [selected, setSelected] = useState<CalendarEvent | null>(null), [notice, setNotice] = useState('')
  const [visibleCount, setVisibleCount] = useModuleState<number>('personal-calendar-visible-count', practice.isExample, () => 12)
  useEffect(()=>{const url=new URL(window.location.href);if(url.searchParams.get('reminders')==='active'){setTab('reminders');setClientId('');url.searchParams.delete('reminders');window.history.replaceState(null,'',url)}},[])
  function changeTab(next: 'events' | 'reminders') { if (next !== tab) setVisibleCount(12); setTab(next) }
  const events: CalendarEvent[] = [
    ...practice.appointments.filter(a => a.status === 'confirmed' && a.date >= TODAY).map(a => ({ id: a.id, clientId: a.clientId, date: a.date, time: a.time, title: a.title, type: 'appointment' as const })),
    ...practice.clients.filter(c => c.birthDate).map(c => ({ id: `birthday-${c.id}`, clientId: c.id, date: birthdayAfter(c.birthDate), time: '', title: 'День рождения', type: 'birthday' as const })),
  ].filter(e => !clientId || e.clientId === clientId).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const visibleReminders = reminders.filter(r => !clientId || r.clientId === clientId).sort(reminderOrder)
  const rowCount = tab === 'events' ? events.length : visibleReminders.length
  return <><SectionHeader eyebrow="РИТМ СОПРОВОЖДЕНИЯ" title="Напоминания" /><StorageNotice failed={failed} />
    <div className="ex-toolbar"><ClientPicker clients={practice.clients} value={clientId} onChange={id=>{setClientId(id);setNotice('');setVisibleCount(12)}} all /><span className="ep-muted">От {formatDate(TODAY)} · {practice.profile.timeZone}</span></div>
    <div className="ex-tabs" role="group" aria-label="Тип событий"><button aria-pressed={tab === 'events'} onClick={() => changeTab('events')}>Ближайшие события</button><button aria-pressed={tab === 'reminders'} onClick={() => changeTab('reminders')}>Активных напоминаний · {visibleReminders.filter(r => !r.done).length}</button></div>
    {notice && <Notice>{notice}</Notice>}
    {rowCount > 0 && <p className="ep-muted" role="status">{countLabel(rowCount, tab === 'events' ? ['событие', 'события', 'событий'] : ['напоминание', 'напоминания', 'напоминаний'])}{rowCount > visibleCount ? ` · показано ${visibleCount}` : ''}</p>}
    {tab === 'events' ? events.length ? <div className="ex-list">{events.slice(0, visibleCount).map(event => { const client = practice.clients.find(c => c.id === event.clientId)!; const saved = reminders.some(r => r.eventId === event.id && !r.done); return <article className="ex-row" key={event.id}><div><p className="ep-eyebrow">{event.type === 'birthday' ? 'ДЕНЬ РОЖДЕНИЯ' : 'КОНСУЛЬТАЦИЯ'}</p><h2>{client.name} · {event.title}</h2><p className="ep-muted">{formatDate(event.date)}{event.time && ` · ${event.time}`}</p><button className="ep-text-button" onClick={() => onOpenClient(client.id)}>Карточка клиента</button></div>{saved ? <button className="ep-button" onClick={() => changeTab('reminders')}>Открыть напоминание</button> : <button className="ep-button" onClick={() => setSelected(event)}>Добавить напоминание</button>}</article> })}</div> : <EmptyState icon="calendar" title="Пока нет ближайших событий" action={<a className="ep-button" href="#calendar">Открыть календарь</a>}>Добавьте встречу или дату рождения клиента — событие появится здесь.</EmptyState> : visibleReminders.length ? <div className="ex-list">{visibleReminders.slice(0, visibleCount).map(reminder => <article className="ex-row" key={reminder.id}><div><span className="ex-status">{reminder.done ? 'Выполнено' : 'Запланировано'}</span><h2>{practice.clients.find(c => c.id === reminder.clientId)?.name || 'Клиент'}</h2><p>{reminder.text}</p><p className="ep-muted">{formatDate(reminder.date)} · {reminder.time} · {practice.profile.timeZone}</p></div><button className="ep-button" onClick={() => {setReminders(old => old.map(r => r.id === reminder.id ? { ...r, done: !r.done } : r));if(!reminder.done)learning.complete('astro-calendar')}}>{reminder.done ? 'Вернуть в план' : 'Отметить выполненным'}</button></article>)}</div> : <EmptyState icon="note" title="Напоминаний пока нет" action={<button className="ep-button" onClick={() => changeTab('events')}>Выбрать событие</button>}>Выберите событие и сохраните, когда и о чём хотите вспомнить.</EmptyState>}
    {rowCount > visibleCount && <div className="ex-list-more"><button className="ep-button" onClick={() => setVisibleCount(count => count + 12)}>Показать ещё {Math.min(12, rowCount - visibleCount)}</button><span className="ep-muted">Показано {Math.min(visibleCount, rowCount)} из {rowCount}</span></div>}
    <p className="ex-note">Здесь собраны встречи и дни рождения клиентов. Добавляйте личные напоминания, чтобы подготовиться заранее.</p>
    {selected && <ReminderDialog event={selected} clientName={practice.clients.find(c => c.id === selected.clientId)?.name || ''} timeZone={practice.profile.timeZone} onClose={() => setSelected(null)} onSave={(date, time, text) => { setReminders(old => [...old, { id: uid(), eventId: selected.id, clientId: selected.clientId, date, time, text, done: false }]); learning.complete('astro-calendar');setSelected(null); changeTab('reminders'); setNotice('Напоминание сохранено. Оно появилось в вашем списке.') }} />}
  </>
}
function ReminderDialog({ event, clientName, timeZone, onClose, onSave }: { event: CalendarEvent; clientName: string; timeZone: string; onClose: () => void; onSave: (date: string, time: string, text: string) => void }) {
  const initialTime=event.time || '10:00', initialText=event.type === 'birthday' ? `Поздравить ${clientName} с днём рождения` : `Подготовиться к встрече: ${clientName} — ${event.title}`
  const [date, setDate] = useState(event.date), [time, setTime] = useState(initialTime), [text, setText] = useState(initialText), [error, setError] = useState('')
  const exit=useFormExit(onClose)

  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const data = new FormData(e.currentTarget); const selectedDate = String(data.get('date') || ''); const selectedTime = String(data.get('time') || ''); const reminderText = String(data.get('text') || '').trim(); if (!validDate(selectedDate) || selectedDate < TODAY) return setError('Выберите дату не раньше 15 октября 2026 года.'); if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(selectedTime)) return setError('Укажите время напоминания.'); if (!reminderText) return setError('Напишите, о чём напомнить.'); onSave(selectedDate, selectedTime, reminderText) }
  return <Dialog title={`Напоминание · ${clientName}`} onClose={exit.close}><form className="ep-form" onSubmit={submit} onInput={exit.changed} onChange={exit.changed}><p className="ex-note">{event.title} · {formatDate(event.date)}{event.time && ` · ${event.time}`}</p><div className="ep-form-pair"><label>Когда напомнить<input name="date" type="date" value={date} min={TODAY} onInput={e => setDate(e.currentTarget.value)} onChange={e => setDate(e.target.value)} required /></label><label>Время<input name="time" type="time" value={time} onInput={e => setTime(e.currentTarget.value)} onChange={e => setTime(e.target.value)} required /></label></div><label>О чём напомнить<textarea name="text" rows={4} value={text} onInput={e => setText(e.currentTarget.value)} onChange={e => setText(e.target.value)} required /></label><p className="ep-muted">Часовой пояс: {timeZone}. Напоминание появится в вашем списке.</p>{error && <Notice error>{error}</Notice>}{exit.warning}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>Отмена</button><button className="ep-button ep-button--primary">Сохранить напоминание</button></footer></form></Dialog>
}

export function initialMaterials(example: boolean): Material[] {
  return example ? [
    { id: 'm1', title: 'Перед первой встречей', category: 'Подготовка к встрече', text: '1. Уточнить, с каким вопросом приходит клиент.\n2. Проверить дату, место и известность времени рождения.\n3. Согласовать длительность и формат встречи.\n4. В конце выделить одно следующее действие.', updated: '2026-10-14T12:00:00.000Z' },
    { id: 'm2', title: 'Как подвести итоги месяца', category: 'Практики', text: 'Предложите клиенту вспомнить три значимых события месяца. Что получилось? Что оказалось сложнее ожидаемого?\n\nСформулируйте одну достижимую цель до следующей встречи и договоритесь, как заметить результат.', updated: '2026-10-12T12:00:00.000Z' },
    { id: 'm3', title: 'Вопросы о профессиональном выборе', category: 'Трактовки', text: 'Вопросы для подготовки к консультации.\n\nЧто клиент хочет изменить в работе? Какие ограничения он видит? Какие варианты уже рассматривает?\n\nСвязывайте наблюдения с реальным запросом и проверяйте каждое утверждение перед обсуждением.', updated: '2026-10-10T12:00:00.000Z' },
  ] : []
}
function Library({ practice }: ModuleProps) {
  const learning=useLearning()
  const [storedMaterials, setMaterials, failed] = useModuleState<Material[]>('library', practice.isExample, () => initialMaterials(practice.isExample))
  const currentSeeds = initialMaterials(true)
  const materials = storedMaterials.map(material => {
    const seed = currentSeeds.find(item => item.id === material.id)
    if (!seed) return material
    const legacyText = material.id === 'm1'
      ? `${seed.text}\n\nЭто редактируемый пример вашей рабочей памятки.`
      : material.id === 'm3'
        ? seed.text.replace('Вопросы для подготовки к консультации.', 'Авторская заметка для подготовки, не автоматическая интерпретация карты.')
        : null
    return material.text === legacyText ? { ...material, text: seed.text } : material
  })
  const [search, setSearch] = useState(''), [category, setCategory] = useState(''), [selected, setSelected] = useState<string | null>(null), [editing, setEditing] = useState<Material | 'new' | null>(null), [notice, setNotice] = useState(''), [deleting, setDeleting] = useState(false)
  const material = materials.find(m => m.id === selected)
  const filtered = materials.filter(m => (!category || m.category === category) && `${m.title} ${m.text}`.toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru'))).sort((a, b) => b.updated.localeCompare(a.updated))
  return <><SectionHeader eyebrow="ВАШИ ЗНАНИЯ" title="Мои материалы" action={<button className="ep-button ep-button--primary" onClick={() => setEditing('new')}><Icon name="plus" size={18} />Добавить материал</button>} /><StorageNotice failed={failed} />{notice && <Notice>{notice}</Notice>}
    {material ? <><button className="ep-back" onClick={() => { setSelected(null); setDeleting(false) }}><Icon name="back" size={16} />Все материалы</button><article className="ex-panel"><div className="ep-section-heading"><span className="ex-status">{material.category}</span><button className="ep-button" onClick={() => setEditing(material)}>Редактировать</button></div><h2>{material.title}</h2><p className="ep-muted">Изменено {formatDate(material.updated.slice(0, 10))} · ваш материал</p><div className="ex-material-text" style={{ whiteSpace: 'pre-wrap' }}>{material.text}</div></article><div className="ex-toolbar"><p className="ep-muted">Материал доступен только вам. Текст можно адаптировать под каждого клиента.</p><button className="ep-text-button" onClick={() => setDeleting(true)}>Удалить материал</button></div></> : <><div className="ex-toolbar"><div className="ep-search"><Icon name="search" /><input aria-label="Поиск материалов" placeholder="Найти материал" value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label="Очистить поиск" onClick={() => setSearch('')}><Icon name="close" size={18} /></button>}</div><label>Раздел<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Все материалы</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
      {filtered.length ? <div className="ex-list">{filtered.map(m => <button className="ex-row" key={m.id} onClick={() => { setSelected(m.id); setNotice('') }}><span><span className="ep-eyebrow">{m.category}</span><strong>{m.title}</strong><span className="ep-muted">{m.text.slice(0, 130)}{m.text.length > 130 ? '…' : ''}</span></span><Icon name="arrow" /></button>)}</div> : <EmptyState icon={materials.length ? 'search' : 'note'} title={materials.length ? 'Материал не найден' : 'Материалов пока нет'} action={materials.length ? <button className="ep-button" onClick={() => { setSearch(''); setCategory('') }}>Сбросить фильтры</button> : <button className="ep-button" onClick={() => setEditing('new')}>Написать первую памятку</button>}>{materials.length ? 'Попробуйте другое слово или раздел.' : 'Добавляйте собственные тексты и возвращайтесь к ним при подготовке к встречам.'}</EmptyState>}
    </>}
    {editing && <MaterialDialog material={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onSave={value => { const id = editing === 'new' ? uid() : editing.id; setMaterials(old => [...old.filter(m => m.id !== id), { ...value, id, updated: dateStamp() }]); learning.complete('library');setEditing(null); setSelected(id); setNotice('Материал сохранён.') }} />}
    {deleting && material && <Dialog title="Удалить материал?" onClose={() => setDeleting(false)}><div className="ep-dialog-body"><p>«{material.title}» будет удалён из ваших материалов.</p><div className="ep-form-footer"><button className="ep-button" onClick={() => setDeleting(false)}>Оставить</button><button className="ep-button ep-button--primary" onClick={() => { setMaterials(old => old.filter(m => m.id !== material.id)); setSelected(null); setDeleting(false); setNotice('Материал удалён.') }}>Удалить</button></div></div></Dialog>}
  </>
}
function MaterialDialog({ material, onClose, onSave }: { material?: Material; onClose: () => void; onSave: (m: Pick<Material, 'title' | 'category' | 'text'>) => void }) {
  const [title, setTitle] = useState(material?.title || ''), [category, setCategory] = useState(material?.category || categories[0]), [text, setText] = useState(material?.text || ''), [error, setError] = useState('')
  const exit=useFormExit(onClose)
  function submit(e: FormEvent) { e.preventDefault(); if (!title.trim() || !text.trim()) return setError('Добавьте название и текст материала.'); onSave({ title: title.trim(), category, text: text.trim() }) }
  return <Dialog title={material ? 'Редактировать материал' : 'Новый материал'} onClose={exit.close} wide><form className="ep-form" onSubmit={submit} onInput={exit.changed} onChange={exit.changed}><label>Название<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Например, подготовка к первой встрече" required /></label><label>Раздел<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Ваш текст<textarea rows={9} value={text} onChange={e => setText(e.target.value)} placeholder="Запишите свою методику, вопросы или наблюдения…" required /></label><p className="ep-muted">Ваш рабочий материал виден только вам.</p>{error && <Notice error>{error}</Notice>}{exit.warning}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={exit.close}>Отмена</button><button className="ep-button ep-button--primary">Сохранить материал</button></footer></form></Dialog>
}
