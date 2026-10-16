import './returning-finance.css'
import {useLearning} from '../components/Learning'
import { useContext, useEffect, useRef, useState, type FormEvent } from 'react'
import { Dialog } from '../components/Dialog'
import { useFormExit } from '../components/useFormExit'
import { Icon } from '../components/Icon'
import { memberPayments } from '../state/memberCore'
import { MEMBER_SCOPE } from '../state/memberAccount'
import { formatDate, TODAY, type Appointment } from '../state/model'
import { EmptyState, Notice, SectionHeader, countLabel, money, useModuleState, ModuleScopeContext, type ModuleProps } from './ModuleKit'

export type Service = { id: string; name: string; description: string; price: number; duration: number; includes: string[]; status: 'draft' | 'available' }
export type Payment = { id: string; appointmentId?: string; clientId: string; serviceId: string; serviceName: string; date: string; receivedDate?: string; manualReceipt?: boolean; amount: number; commission: number; status: 'paid' | 'pending' | 'refunded' }
// Legacy saved payments may omit the relation. Recover only an exact known seed,
// never a same-day/name guess: a payment can precede a meeting or share its date.
export function paymentAppointment(payment: Payment, appointments: Appointment[], knownPayments: Payment[] = []): Appointment | undefined {
 const seed = !payment.appointmentId ? knownPayments.find(p => p.id === payment.id && p.clientId === payment.clientId && p.serviceId === payment.serviceId && p.serviceName === payment.serviceName && p.date === payment.date && p.amount === payment.amount) : undefined
 const appointmentId = payment.appointmentId ?? seed?.appointmentId
 return appointmentId ? appointments.find(a => a.id === appointmentId && a.clientId === payment.clientId) : undefined
}
export function paymentDate(payment: Payment) { return payment.status === 'paid' ? payment.receivedDate ?? payment.date : payment.date }
export function markPaymentReceived(payment: Payment, receivedDate: string): Payment {
 if (payment.status !== 'pending') throw new Error('Отметить оплату можно только для ожидающего заказа.')
 const parsed = new Date(`${receivedDate}T12:00:00Z`)
 if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedDate) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== receivedDate || receivedDate > TODAY) throw new Error('Укажите корректную дату получения денег — не позже сегодняшнего дня.')
 return {...payment, status:'paid', receivedDate, manualReceipt:true}
}
export function undoPaymentReceipt(payment: Payment): Payment {
 if (payment.status !== 'paid' || !payment.manualReceipt) throw new Error('Можно отменить только добавленную вручную отметку об оплате.')
 const {receivedDate: _, manualReceipt: __, ...order} = payment
 return {...order,status:'pending'}
}
type Period = 'month' | 'week' | 'all'
const statusText = { paid: 'Оплачено', pending: 'Ждём оплату', refunded: 'Возвращено' }
const periodStart: Record<Period, string> = { month: '2026-10-01', week: '2026-10-09', all: '2000-01-01' }
export function uniqueIncludes(text: string): string[] { return [...new Map(text.split('\n').map(s => s.trim()).filter(Boolean).map(s => [s.toLocaleLowerCase('ru-RU').replace(/[.,;:!?]+$/g, ''), s])).values()] }
export function paymentTotals(payments: Payment[]) { return payments.reduce((sum, p) => p.status === 'paid' ? { gross: sum.gross + p.amount, fee: sum.fee + p.commission, net: sum.net + p.amount - p.commission } : sum, { gross: 0, fee: 0, net: 0 }) }
export const DEFAULT_SERVICES: Service[] = [
 { id: 'natal', name: 'Натальная консультация', description: 'Разберём ваш запрос и наметим следующие шаги.', price: 4900, duration: 60, includes: ['Онлайн-встреча', 'Разбор натальной карты', 'Письменное резюме'], status: 'available' },
 { id: 'followup', name: 'Сопровождение', description: 'Обсудим изменения после консультации и скорректируем план. Одна встреча без подписки.', price: 8900, duration: 90, includes: ['Онлайн-встреча', 'Обновлённый план действий'], status: 'available' },
 { id: 'question', name: 'Разбор одного вопроса', description: 'Сосредоточимся на одном конкретном запросе.', price: 2900, duration: 30, includes: ['Онлайн-встреча', 'Письменные рекомендации'], status: 'available' },
]
const initialPayments = (): Payment[] => [
 { id: 'EH-1045', clientId: 'marina', serviceId: 'natal', serviceName: 'Натальная консультация', date: '2026-10-15', amount: 4900, commission: 196, status: 'paid' },
 { id: 'EH-1044', clientId: 'dmitry', serviceId: 'natal', serviceName: 'Натальная консультация', date: '2026-10-15', amount: 4900, commission: 0, status: 'pending' },
 { id: 'EH-1043', clientId: 'olga', serviceId: 'followup', serviceName: 'Сопровождение', date: '2026-10-14', amount: 8900, commission: 356, status: 'paid' },
 { id: 'EH-1042', clientId: 'marina', serviceId: 'followup', serviceName: 'Сопровождение', date: '2026-10-08', amount: 8900, commission: 0, status: 'refunded' },
 { id: 'EH-1041', clientId: 'olga', serviceId: 'natal', serviceName: 'Натальная консультация', date: '2026-10-03', amount: 4900, commission: 196, status: 'paid' },
 { id: 'EH-1040', clientId: 'marina', serviceId: 'natal', serviceName: 'Натальная консультация', date: '2026-09-25', amount: 4900, commission: 196, status: 'paid' },
]

function ServiceEditor({ service, existing, onClose, onSave }: { service?: Service; existing: Service[]; onClose: () => void; onSave: (s: Service) => void }) {
 const [error, setError] = useState(''), [dirty, setDirty] = useState(false)
 const exit = useFormExit(onClose)
 function close() { if (dirty) exit.close(); else onClose() }
 function changed(event: FormEvent<HTMLFormElement>) {
  const data = new FormData(event.currentTarget)
  const initial = { name: service?.name ?? '', description: service?.description ?? '', price: String(service?.price ?? 5000), duration: String(service?.duration ?? 60), includes: service?.includes.join('\n') ?? 'Онлайн-встреча', status: service?.status ?? 'draft' }
  setDirty(Object.entries(initial).some(([key, value]) => String(data.get(key) ?? '') !== value)); exit.changed()
 }
 const [composition, setComposition] = useState(service?.includes.join('\n') ?? 'Онлайн-встреча')
 const lines = composition.split('\n').map(s => s.trim()).filter(Boolean)
 const unique = uniqueIncludes(composition)
 function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); const data = new FormData(event.currentTarget)
  const name = String(data.get('name')).trim(), price = Number(data.get('price')), duration = Number(data.get('duration'))
  if (!name) return setError('Добавьте название услуги.')
  if (existing.some(s => s.id !== service?.id && s.name.toLocaleLowerCase('ru-RU') === name.toLocaleLowerCase('ru-RU'))) return setError('Услуга с таким названием уже есть. Выберите другое название.')
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) return setError('Укажите стоимость в целых рублях, не меньше нуля.')
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) return setError('Укажите длительность от 15 до 480 минут.')
  if (!unique.length) return setError('Укажите хотя бы один результат для клиента.')
  onSave({ id: service?.id ?? crypto.randomUUID(), name, price, duration, description: String(data.get('description')).trim(), includes: unique, status: data.get('status') === 'available' ? 'available' : 'draft' })
 }
 return <Dialog title={service ? 'Изменить услугу' : 'Новая услуга'} onClose={close}><form className="ep-form" onSubmit={submit} onChange={changed}>
  {exit.warning}
  <label>Название<input name="name" defaultValue={service?.name} required maxLength={100} placeholder="Например, натальная консультация" /></label>
  <label>Кому и с чем поможет<textarea name="description" defaultValue={service?.description} rows={2} maxLength={600} placeholder="Коротко опишите, что вы разберёте на встрече" /></label>
  <div className="ep-form-pair"><label>Стоимость, ₽<input type="number" name="price" min="0" step="1" defaultValue={service?.price ?? 5000} required /></label><label>Длительность, минут<input type="number" name="duration" min="15" max="480" step="1" defaultValue={service?.duration ?? 60} required /></label></div>
  <label>Что входит<textarea name="includes" value={composition} onChange={e => setComposition(e.target.value)} rows={4} placeholder="Каждый результат с новой строки" required /></label>
  <p className="ep-muted">Каждый результат — с новой строки. Всё перечисленное включено в стоимость.</p>
  {lines.length !== unique.length && <Notice>Повторяющиеся пункты объединим при сохранении.</Notice>}
  <label>Состояние<select name="status" defaultValue={service?.status ?? 'draft'}><option value="draft">Черновик — виден только вам</option><option value="available">Доступна — видна клиентам</option></select></label>

  {error && <Notice error>{error}</Notice>}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={close}>Отмена</button><button className="ep-button ep-button--primary">Сохранить услугу</button></footer>
 </form></Dialog>
}

function PaymentDetails({payment, clientName, hasClient, appointment, onSave, onOpenClient, onOpenAppointment, onClose, storageFailed}: {payment:Payment;storageFailed:boolean;clientName:string;hasClient:boolean;appointment?:Appointment;onSave:(payment:Payment)=>void;onOpenClient:()=>void;onOpenAppointment:(appointment:Appointment)=>void;onClose:()=>void}) {
 const [step,setStep]=useState<'details'|'record'|'undo'>('details'),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const receiptDate=useRef<HTMLInputElement>(null),undoCancel=useRef<HTMLButtonElement>(null)
 useEffect(()=>{const frame=requestAnimationFrame(()=>{if(step==='record')receiptDate.current?.focus();else if(step==='undo')undoCancel.current?.focus()});return()=>cancelAnimationFrame(frame)},[step])
 function saveReceipt(event:FormEvent<HTMLFormElement>) {
  event.preventDefault()
  try { const next=markPaymentReceived(payment,String(new FormData(event.currentTarget).get('receivedDate')??''));onSave(next);setStep('details');setError('');setNotice('Оплата отмечена. Сумма учтена в поступлениях.')} catch(e){setError((e as Error).message)}
 }
 function undo() {try {onSave(undoPaymentReceipt(payment));setStep('details');setError('');setNotice('Отметка отменена. Заказ снова ожидает оплаты.')}catch(e){setError((e as Error).message)}}
 return <Dialog title={step==='record'?'Отметить оплату':step==='undo'?'Отменить отметку?':`Оплата · ${clientName}`} onClose={onClose}>
  {step==='record'?<form className="ep-form ef-receipt-form" onSubmit={saveReceipt}>
   <div className="ef-receipt-summary"><strong>{clientName}</strong><span>{payment.serviceName}</span><b>{money(payment.amount)}</b></div>
   <p className="ep-muted">Отметьте оплату, если деньги уже получены. Сохранение только обновит учёт заказа.</p>
   <label>Дата получения денег<input ref={receiptDate} name="receivedDate" type="date" required max={TODAY} defaultValue={TODAY}/></label>
   {error&&<Notice error>{error}</Notice>}
   <footer className="ep-form-footer"><button type="button" className="ep-button" onClick={()=>{setStep('details');setError('')}}>Назад</button><button className="ep-button ep-button--primary">Подтвердить оплату</button></footer>
  </form>:step==='undo'?<div className="ep-dialog-body ef-payment-details"><p><strong>{clientName} · {money(payment.amount)}</strong></p><p>Заказ снова будет ждать оплаты, а сумма исчезнет из поступлений. Деньги клиенту не возвращаются.</p>{error&&<Notice error>{error}</Notice>}<div className="ep-form-footer"><button ref={undoCancel} className="ep-button" onClick={()=>setStep('details')}>Оставить отметку</button><button className="ep-button ep-button--primary" onClick={undo}>Отменить отметку</button></div></div>:<div className="ep-dialog-body ef-payment-details">
   {storageFailed?<Notice error>Не удалось сохранить отметку. Не закрывайте страницу.</Notice>:notice&&<Notice>{notice}</Notice>}
   <p className="ex-status">{statusText[payment.status]}</p><h3>{payment.serviceName}</h3><p className="ep-muted">Заказ {payment.id}</p>
   <p className="ef-payment-amount">{money(payment.amount)}</p>
   {payment.status==='pending'&&<button className="ep-button ep-button--primary ef-record-button" onClick={()=>{setStep('record');setNotice('');setError('')}}>Отметить оплату</button>}
   <dl className="ex-detail"><div><dt>Дата заказа</dt><dd>{formatDate(payment.date)}</dd></div>{payment.status==='paid'&&<div><dt>Получено</dt><dd>{formatDate(paymentDate(payment))}</dd></div>}<div><dt>Комиссия</dt><dd>{money(payment.commission)}</dd></div>{payment.status==='paid'&&<div><dt>После комиссии</dt><dd>{money(payment.amount-payment.commission)}</dd></div>}</dl>
   <details className="ef-payment-history"><summary>История заказа</summary><ol className="ex-history"><li>{payment.status==='paid'?`${formatDate(paymentDate(payment))} · ${payment.manualReceipt?'Получение оплаты отмечено вручную':'Оплата получена'}`:payment.status==='pending'?'Ожидаем оплату клиента':'Оплата возвращена'}</li><li>{formatDate(payment.date)} · Заказ создан</li></ol></details>
   {hasClient&&<>{appointment&&<p className="ep-muted">Встреча: {formatDate(appointment.date)} · {appointment.time}</p>}<div className="ep-actions">{appointment&&<button className="ep-button" onClick={()=>onOpenAppointment(appointment)}>Открыть встречу <Icon name="arrow"/></button>}<button className="ep-button" onClick={onOpenClient}>Открыть клиента</button></div></>}
   {payment.status==='paid'&&payment.manualReceipt&&<button className="ep-text-button ef-undo-payment" onClick={()=>{setStep('undo');setNotice('')}}>Отменить ошибочную отметку</button>}
  </div>}
 </Dialog>
}

export function ServicesFinance({ section, practice, onOpenClient }: ModuleProps & { section: 'services' | 'finance' | 'analytics' }) {
 const learning=useLearning()
 const scope = useContext(ModuleScopeContext)
 const [services, setServices, serviceStorageFailed] = useModuleState<Service[]>('services', practice.isExample, () => practice.isExample ? DEFAULT_SERVICES : [])
 const [payments, setPayments, paymentStorageFailed] = useModuleState<Payment[]>('payments', practice.isExample, () => practice.isExample ? initialPayments() : [])
 const [query, setQuery] = useModuleState<string>('services-query',practice.isExample,()=>''), [serviceStatus, setServiceStatus] = useModuleState<string>('services-filter',practice.isExample,()=>'all'), [period, setPeriod] = useModuleState<Period>(`${section}-period`,practice.isExample,()=>'month'), [paymentStatus, setPaymentStatus] = useModuleState<string>('finance-status',practice.isExample,()=>'all')
 const [paymentQuery, setPaymentQuery] = useModuleState<string>('finance-query', practice.isExample, () => '')
 const [paymentLimit, setPaymentLimit] = useModuleState<number>('finance-visible-count', practice.isExample, () => 12)
 const [clientLimit, setClientLimit] = useModuleState<number>('analytics-visible-clients', practice.isExample, () => 6)
 const [editor, setEditor] = useState<Service | 'new' | null>(null), [preview, setPreview] = useState<Service | null>(null), [operation, setOperation] = useState<Payment | null>(null), [notice, setNotice] = useState(''), [savedId, setSavedId] = useState('')
 useEffect(() => { if (savedId && !editor) document.getElementById(`service-${savedId}`)?.scrollIntoView({ block: 'nearest' }) }, [savedId, editor])
 const filteredServices = services.filter(s => (serviceStatus === 'all' || s.status === serviceStatus) && `${s.name} ${s.description}`.toLocaleLowerCase('ru-RU').includes(query.toLocaleLowerCase('ru-RU'))).sort((a, b) => Number(b.id === savedId) - Number(a.id === savedId))
 const periodPayments = payments.filter(p => paymentDate(p) >= periodStart[period] && paymentDate(p) <= TODAY)
 const totals = paymentTotals(periodPayments)
 const clientName = (id: string) => practice.clients.find(c => c.id === id)?.name ?? 'Клиент удалён'
 const paymentSearch = paymentQuery.trim().toLocaleLowerCase('ru-RU')
 const shownPayments = periodPayments.filter(p => (paymentStatus === 'all' || p.status === paymentStatus) && `${clientName(p.clientId)} ${p.serviceName} ${p.id}`.toLocaleLowerCase('ru-RU').includes(paymentSearch)).sort((a, b) => paymentDate(b).localeCompare(paymentDate(a)) || b.id.localeCompare(a.id))
 const visiblePayments = shownPayments.slice(0, paymentLimit)
 const clearPaymentFilters = () => { setPaymentQuery(''); setPaymentStatus('all'); setPaymentLimit(12) }
 const rangeText = period === 'month' ? '1–15 октября 2026' : period === 'week' ? '9–15 октября 2026' : 'Вся история до 15 октября 2026'
 const periodSelect = <label>Период<select aria-label="Период отчёта" value={period} onChange={e => { setPeriod(e.target.value as Period);learning.complete('analytics'); setPaymentLimit(12); setClientLimit(6) }}><option value="month">Этот месяц</option><option value="week">Последние 7 дней</option><option value="all">Всё время</option></select></label>
 const openClient = (id: string) => { setOperation(null); onOpenClient(id) }
 const relatedAppointment = operation ? paymentAppointment(operation, practice.appointments, scope === MEMBER_SCOPE ? memberPayments : []) : undefined
 const openAppointment = (appointment: Appointment) => { const url = new URL(window.location.href); url.searchParams.set('appointment', appointment.id); window.history.replaceState(window.history.state, '', url); openClient(appointment.clientId) }
 const paid = periodPayments.filter(p => p.status === 'paid')
 const popular = [...new Set(paid.map(p => p.serviceId))].map(id => { const rows = paid.filter(p => p.serviceId === id); return { id, name: rows[0].serviceName, count: rows.length, amount: paymentTotals(rows).net } }).sort((a, b) => b.count - a.count)
 const paidClientIds = [...new Set(paid.map(p => p.clientId))]
 if(section!=='services'&&!payments.length)return <><SectionHeader eyebrow="Ваша практика" title={section==='finance'?'Оплаты':'Аналитика'}/><EmptyState icon="wallet" title={section==='finance'?'Здесь будут оплаты':'Пока недостаточно данных'} action={<a className="ep-button" href="#services">Перейти к услугам <Icon name="arrow"/></a>}>После первых оплат здесь появятся суммы, история и результаты. Начните с описания услуги для клиентов.</EmptyState></>
 return <>
  {section === 'services' ? <>
   <SectionHeader eyebrow="Ваша практика" title="Услуги и цены" action={<button className="ep-button ep-button--primary" onClick={() => setEditor('new')}><Icon name="plus" />Создать услугу</button>} />
   <div className="ex-toolbar"><label className="ep-search"><Icon name="search" /><input aria-label="Найти услугу" placeholder="Найти услугу" value={query} onChange={e => setQuery(e.target.value)} /></label><label>Показывать<select value={serviceStatus} onChange={e => setServiceStatus(e.target.value)}><option value="all">Все услуги</option><option value="available">Доступные</option><option value="draft">Черновики</option></select></label></div>
   {notice && <Notice>{notice}</Notice>}
   {filteredServices.length ? <div className="ex-list">{filteredServices.map(service => <article className="ex-row" id={`service-${service.id}`} key={service.id}><div><span className="ex-status">{service.status === 'draft' ? 'Черновик' : 'Доступна'}</span><h2>{service.name}</h2>{service.id === savedId && <span className="ep-muted">Только что сохранено</span>}<p>{service.description}</p><p className="ep-muted">{service.duration} минут · {countLabel(service.includes.length,['результат','результата','результатов'])} · {money(service.price)}</p></div><div className="ep-actions"><button className="ep-button" onClick={() => setPreview(service)}>Глазами клиента</button><button className="ep-button" onClick={() => setEditor(service)}>Изменить</button></div></article>)}</div> : <EmptyState title={services.length ? 'Услуги не найдены' : 'Начните с одной услуги'}>{services.length ? 'Попробуйте другое название или измените фильтр.' : 'Дайте ей понятное название и опишите результат. Сложный каталог не нужен.'}</EmptyState>}
  </> : <>
   <SectionHeader eyebrow="Ваша практика" title={section === 'finance' ? 'Оплаты' : 'Аналитика'} />
   {notice&&<Notice>{notice}</Notice>}
   <div className="ex-toolbar">{periodSelect}<p className="ep-muted">{rangeText}</p></div>

   {section === 'finance' ? <>
    <section className="ef-finance-summary" aria-label="Итоги оплат за выбранный период"><div className="ef-finance-gross"><span>Поступило</span><strong>{money(totals.gross)}</strong></div><details className="ef-finance-breakdown"><summary>Комиссия и итог</summary><dl><div><dt>Комиссия</dt><dd>{money(totals.fee)}</dd></div><div><dt>После комиссии</dt><dd>{money(totals.net)}</dd></div></dl><p>Учитываются только оплаченные заказы за выбранный период.</p></details></section>
    <h2>Операции</h2>
    <div className="ex-toolbar ex-payment-toolbar"><label className="ep-search"><Icon name="search" /><input aria-label="Найти операцию" placeholder="Клиент, услуга или номер" value={paymentQuery} onChange={e => { setPaymentQuery(e.target.value); setPaymentLimit(12) }} /></label><label>Статус<select value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPaymentLimit(12) }}><option value="all">Все операции</option><option value="paid">Оплачено</option><option value="pending">Ждём оплату</option><option value="refunded">Возвращено</option></select></label></div>
    <p className="ep-muted">Сумма поступлений — за выбранный период, независимо от поиска и статуса.</p>
    <div className="ex-payment-results"><p className="ep-muted" role="status">{countLabel(shownPayments.length, ['операция', 'операции', 'операций'])}{shownPayments.length > visiblePayments.length ? ` · показано ${visiblePayments.length}` : ''}</p>{(paymentSearch || paymentStatus !== 'all') && <button className="ep-text-button" onClick={clearPaymentFilters}>Сбросить фильтры</button>}</div>
    {shownPayments.length ? <><div className="ex-list ex-payment-list">{visiblePayments.map(payment => <button className="ex-row ex-row-button ex-payment-row" key={payment.id} onClick={() => {setOperation(payment);learning.complete('finance')}}><div className="ex-payment-info"><strong>{clientName(payment.clientId)}</strong><p>{payment.serviceName}</p><small>{formatDate(paymentDate(payment))} · {payment.id}</small></div><div className="ex-payment-total"><strong>{money(payment.amount)}</strong><p className="ex-status">{statusText[payment.status]}</p><span>{payment.status==='pending'?'Отметить оплату':'Подробнее'} <Icon name="arrow" size={16} /></span></div></button>)}</div>{shownPayments.length > paymentLimit && <div className="ex-list-more"><button className="ep-button" onClick={() => setPaymentLimit(count => count + 12)}>Показать ещё {Math.min(12, shownPayments.length - paymentLimit)}</button><span className="ep-muted">Показано {visiblePayments.length} из {shownPayments.length}</span></div>}</> : <EmptyState title={paymentSearch ? 'Операции не найдены' : paymentStatus !== 'all' ? 'Нет операций с таким статусом' : 'Нет операций за этот период'} action={(paymentSearch || paymentStatus !== 'all') ? <button className="ep-button" onClick={clearPaymentFilters}>Сбросить фильтры</button> : undefined}>{paymentSearch ? 'Попробуйте имя клиента, название услуги или номер операции. Можно сбросить поиск и статус.' : paymentStatus !== 'all' ? 'Сбросьте статус или выберите другой период.' : 'Выберите другой период, чтобы посмотреть историю оплат.'}</EmptyState>}

   </> : <div className="ex-list">
    <section className="ex-panel"><p className="ep-eyebrow">01 · Доход</p><h2>Сколько заработано?</h2><p className="ex-amount">{money(totals.net)}</p><p>После комиссии · {countLabel(paid.length,['оплата','оплаты','оплат'])} за выбранный период</p><details><summary>Из чего складывается сумма</summary><dl className="ex-detail"><div><dt>Поступило</dt><dd>{money(totals.gross)}</dd></div><div><dt>Комиссия</dt><dd>−{money(totals.fee)}</dd></div><div><dt>После комиссии</dt><dd>{money(totals.net)}</dd></div></dl><p className="ep-muted">Ожидаемые и возвращённые платежи не включены.</p></details></section>
    <section className="ex-panel"><p className="ep-eyebrow">02 · Услуги</p><h2>Что выбирают клиенты?</h2>{popular.length ? <div className="ex-list">{popular.map(item => <div className="ex-row ex-analytics-service" key={item.id}><div><strong>{item.name}</strong><p>Оплаченных заказов: {item.count}</p></div><strong>{money(item.amount)}</strong></div>)}</div> : <p className="ep-muted">Пока нет оплаченных заказов за этот период.</p>}<p className="ep-muted">Учитываем только оплаченные услуги. Суммы указаны после комиссии.</p></section>
    <section className="ex-panel"><p className="ep-eyebrow">03 · Клиенты</p><h2>Кто возвращается?</h2>{paidClientIds.length ? <div className="ex-list">{paidClientIds.slice(0, clientLimit).map(id => { const count = paid.filter(p => p.clientId === id).length; return <div className="ex-row" key={id}><div><strong>{clientName(id)}</strong><p>{countLabel(count, ['оплаченный заказ', 'оплаченных заказа', 'оплаченных заказов'])} за период</p></div>{practice.clients.some(c => c.id === id) && <button className="ep-button" onClick={() => openClient(id)}>Открыть клиента</button>}</div> })}</div> : <p className="ep-muted">Клиенты появятся здесь после первой оплаты.</p>}{paidClientIds.length > clientLimit && <div className="ex-list-more"><button className="ep-button" onClick={() => setClientLimit(count => count + 6)}>Показать ещё {Math.min(6, paidClientIds.length - clientLimit)}</button><span className="ep-muted">Показано {Math.min(clientLimit, paidClientIds.length)} из {paidClientIds.length}</span></div>}<p className="ep-muted">Повторный заказ считаем в рамках выбранного периода. Карточка клиента поможет подготовить следующую встречу.</p></section>
   </div>}
  </>}
  {(serviceStorageFailed || paymentStorageFailed) && <Notice error>Не удалось сохранить изменения. Не закрывайте страницу и попробуйте ещё раз.</Notice>}
  {editor && <ServiceEditor service={editor === 'new' ? undefined : editor} existing={services} onClose={() => setEditor(null)} onSave={service => { setServices(old => old.some(s => s.id === service.id) ? old.map(s => s.id === service.id ? service : s) : [...old, service]); setEditor(null); setQuery(''); setServiceStatus('all'); setSavedId(service.id); learning.complete('services'); setNotice(`«${service.name}» сохранена.`) }} />}
  {preview && <Dialog title="Как услугу видит клиент" onClose={() => setPreview(null)}><div className="ep-dialog-body"><p className="ep-eyebrow">{practice.profile.name} · Консультация</p><h2>{preview.name}</h2><p>{preview.description}</p><p><strong>{money(preview.price)}</strong> · {preview.duration} минут</p><h3>Что вы получите</h3><ul className="ex-service-includes">{preview.includes.map(item => <li key={item}>{item}</li>)}</ul><p className="ex-note">{preview.status === 'draft' ? 'Это черновик. Клиенты пока его не видят.' : 'Предпросмотр предложения для клиента.'}</p><button className="ep-button" onClick={() => { setPreview(null); setEditor(preview) }}>Вернуться к редактированию</button></div></Dialog>}
  {operation && <PaymentDetails key={operation.id} storageFailed={paymentStorageFailed} payment={operation} clientName={clientName(operation.clientId)} hasClient={practice.clients.some(c=>c.id===operation.clientId)} appointment={relatedAppointment} onClose={()=>setOperation(null)} onOpenClient={()=>openClient(operation.clientId)} onOpenAppointment={openAppointment} onSave={next=>{setPayments(items=>items.map(p=>p.id===next.id?next:p));setOperation(next);setNotice(next.status==='paid'?`Оплата ${money(next.amount)} от ${clientName(next.clientId)} учтена.`:'Отметка отменена. Заказ снова ожидает оплаты.')}}/>}
 </>
}
