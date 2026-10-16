import {Select} from '../components/Select'
import {tr} from '../i18n'
import './returning-finance.css'
import {synchronizeAppointmentPayments,visibleAppointmentPayment} from '../state/appointmentPayments'
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
export type Payment = { source?: 'appointment'; id: string; appointmentId?: string; clientId: string; serviceId: string; serviceName: string; date: string; receivedDate?: string; manualReceipt?: boolean; amount: number; commission: number; status: 'paid' | 'pending' | 'refunded' }
// Legacy saved payments may omit the relation. Recover only an exact known seed,
// never a same-day/name guess: a payment can precede a meeting or share its date.
export function paymentAppointment(payment: Payment, appointments: Appointment[], knownPayments: Payment[] = []): Appointment | undefined {
 const seed = !payment.appointmentId ? knownPayments.find(p => p.id === payment.id && p.clientId === payment.clientId && p.serviceId === payment.serviceId && p.serviceName === payment.serviceName && p.date === payment.date && p.amount === payment.amount) : undefined
 const appointmentId = payment.appointmentId ?? seed?.appointmentId
 return appointmentId ? appointments.find(a => a.id === appointmentId && a.clientId === payment.clientId) : undefined
}
export function paymentDate(payment: Payment) { return payment.status === 'paid' ? payment.receivedDate ?? payment.date : payment.date }
export function markPaymentReceived(payment: Payment, receivedDate: string): Payment {
 if (payment.status !== 'pending') throw new Error(tr("Отметить оплату можно только для ожидающего заказа.", "Only orders awaiting payment can be marked as paid."))
 const parsed = new Date(`${receivedDate}T12:00:00Z`)
 if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedDate) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== receivedDate || receivedDate > TODAY) throw new Error(tr("Укажите корректную дату получения денег — не позже сегодняшнего дня.", "Enter a valid date of receipt, no later than today."))
 return {...payment, status:'paid', receivedDate, manualReceipt:true}
}
export function undoPaymentReceipt(payment: Payment): Payment {
 if (payment.status !== 'paid' || !payment.manualReceipt) throw new Error(tr("Можно отменить только добавленную вручную отметку об оплате.", "Only manually recorded payments can be undone."))
 const {receivedDate: _, manualReceipt: __, ...order} = payment
 return {...order,status:'pending'}
}
type Period = 'month' | 'week' | 'all'
const statusText = () => ({ paid: tr("Оплачено", "Paid"), pending: tr("Ждём оплату", "Awaiting payment"), refunded: tr("Возвращено", "Refunded") })
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
  const initial = { name: service?.name ?? '', description: service?.description ?? '', price: String(service?.price ?? 5000), duration: String(service?.duration ?? 60), includes: service?.includes.join('\n') ?? tr("Онлайн-встреча", "Online consultation"), status: service?.status ?? 'draft' }
  setDirty(Object.entries(initial).some(([key, value]) => String(data.get(key) ?? '') !== value)); exit.changed()
 }
 const [composition, setComposition] = useState(service?.includes.join('\n') ?? tr("Онлайн-встреча", "Online consultation"))
 const lines = composition.split('\n').map(s => s.trim()).filter(Boolean)
 const unique = uniqueIncludes(composition)
 function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); const data = new FormData(event.currentTarget)
  const name = String(data.get('name')).trim(), price = Number(data.get('price')), duration = Number(data.get('duration'))
  if (!name) return setError(tr("Добавьте название услуги.", "Enter a service name."))
  if (existing.some(s => s.id !== service?.id && s.name.toLocaleLowerCase('ru-RU') === name.toLocaleLowerCase('ru-RU'))) return setError(tr("Услуга с таким названием уже есть. Выберите другое название.", "A service with this name already exists. Choose another name."))
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(price)) return setError(tr("Укажите стоимость в целых рублях, не меньше нуля.", "Enter a price in whole roubles, zero or more."))
  if (!Number.isInteger(duration) || duration < 15 || duration > 480) return setError(tr("Укажите длительность от 15 до 480 минут.", "Enter a duration between 15 and 480 minutes."))
  if (!unique.length) return setError(tr("Укажите хотя бы один результат для клиента.", "Add at least one item the client will receive."))
  onSave({ id: service?.id ?? crypto.randomUUID(), name, price, duration, description: String(data.get('description')).trim(), includes: unique, status: data.get('status') === 'available' ? 'available' : 'draft' })
 }
 return <Dialog title={service ? tr("Изменить услугу", "Edit service") : tr("Новая услуга", "New service")} onClose={close}><form className="ep-form" onSubmit={submit} onChange={changed}>
  {exit.warning}
  <label>{tr("Название", "Name")}<input name="name" defaultValue={service?.name} required maxLength={100} placeholder={tr("Например, натальная консультация", "For example, natal consultation")} /></label>
  <label>{tr("Кому и с чем поможет", "Who it helps and how")}<textarea name="description" defaultValue={service?.description} rows={2} maxLength={600} placeholder={tr("Коротко опишите, что вы разберёте на встрече", "Briefly describe what you will cover")} /></label>
  <div className="ep-form-pair"><label>{tr("Стоимость, ₽", "Price, ₽")}<input type="number" name="price" min="0" step="1" defaultValue={service?.price ?? 5000} required /></label><label>{tr("Длительность, минут", "Duration, minutes")}<input type="number" name="duration" min="15" max="480" step="1" defaultValue={service?.duration ?? 60} required /></label></div>
  <label>{tr("Что входит", "What is included")}<textarea name="includes" value={composition} onChange={e => setComposition(e.target.value)} rows={4} placeholder={tr("Каждый результат с новой строки", "One item per line")} required /></label>
  <p className="ep-muted">{tr("Каждый результат — с новой строки. Всё перечисленное включено в стоимость.", "One item per line. Everything listed is included in the price.")}</p>
  {lines.length !== unique.length && <Notice>{tr("Повторяющиеся пункты объединим при сохранении.", "Duplicate items will be combined when you save.")}</Notice>}
  <label>{tr("Состояние", "Visibility")}<Select aria-label={tr("Состояние", "Visibility")} name="status" defaultValue={service?.status ?? 'draft'}><option value="draft">{tr("Черновик — виден только вам", "Draft — only visible to you")}</option><option value="available">{tr("Доступна — видна клиентам", "Available — visible to clients")}</option></Select></label>

  {error && <Notice error>{error}</Notice>}<footer className="ep-form-footer"><button type="button" className="ep-button" onClick={close}>{tr("Отмена", "Cancel")}</button><button className="ep-button ep-button--primary">{tr("Сохранить услугу", "Save service")}</button></footer>
 </form></Dialog>
}

function PaymentDetails({payment, clientName, hasClient, appointment, onSave, onOpenClient, onOpenAppointment, onClose, storageFailed}: {payment:Payment;storageFailed:boolean;clientName:string;hasClient:boolean;appointment?:Appointment;onSave:(payment:Payment)=>void;onOpenClient:()=>void;onOpenAppointment:(appointment:Appointment)=>void;onClose:()=>void}) {
 const [step,setStep]=useState<'details'|'record'|'undo'>('details'),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const receiptDate=useRef<HTMLInputElement>(null),undoCancel=useRef<HTMLButtonElement>(null)
 const canReceive=visibleAppointmentPayment(payment,appointment?[appointment]:[])
 useEffect(()=>{const frame=requestAnimationFrame(()=>{if(step==='record')receiptDate.current?.focus();else if(step==='undo')undoCancel.current?.focus()});return()=>cancelAnimationFrame(frame)},[step])
 function saveReceipt(event:FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if(!canReceive){setError(tr("Эта встреча больше не ожидает оплаты.", "This appointment is no longer awaiting payment."));return}
  try { const next=markPaymentReceived(payment,String(new FormData(event.currentTarget).get('receivedDate')??''));onSave(next);setStep('details');setError('');setNotice(tr("Оплата отмечена. Сумма учтена в поступлениях.", "Payment recorded and included in your income."))} catch(e){setError((e as Error).message)}
 }
 function undo() {try {onSave(undoPaymentReceipt(payment));setStep('details');setError('');setNotice(tr("Отметка отменена. Заказ снова ожидает оплаты.", "Payment record undone. The order is awaiting payment again."))}catch(e){setError((e as Error).message)}}
 return <Dialog title={step==='record'?tr("Отметить оплату", "Record payment"):step==='undo'?tr("Отменить отметку?", "Undo payment record?"):tr(`Оплата · ${clientName}`, `Payment · ${clientName}`)} onClose={onClose}>
  {step==='record'?<form className="ep-form ef-receipt-form" onSubmit={saveReceipt}>
   <div className="ef-receipt-summary"><strong>{clientName}</strong><span>{payment.serviceName}</span><b>{money(payment.amount)}</b></div>
   <p className="ep-muted">{tr("Отметьте оплату, если деньги уже получены. Сохранение только обновит учёт заказа.", "Record a payment only once you have received the money. Saving only updates the order record.")}</p>
   <label>{tr("Дата получения денег", "Date received")}<input ref={receiptDate} name="receivedDate" type="date" required max={TODAY} defaultValue={TODAY}/></label>
   {error&&<Notice error>{error}</Notice>}
   <footer className="ep-form-footer"><button type="button" className="ep-button" onClick={()=>{setStep('details');setError('')}}>{tr("Назад", "Back")}</button><button className="ep-button ep-button--primary">{tr("Подтвердить оплату", "Confirm payment")}</button></footer>
  </form>:step==='undo'?<div className="ep-dialog-body ef-payment-details"><p><strong>{clientName} · {money(payment.amount)}</strong></p><p>{tr("Заказ снова будет ждать оплаты, а сумма исчезнет из поступлений. Деньги клиенту не возвращаются.", "The order will await payment again and the amount will be removed from your income. This does not refund the client.")}</p>{error&&<Notice error>{error}</Notice>}<div className="ep-form-footer"><button ref={undoCancel} className="ep-button" onClick={()=>setStep('details')}>{tr("Оставить отметку", "Keep payment record")}</button><button className="ep-button ep-button--primary" onClick={undo}>{tr("Отменить отметку", "Undo payment record")}</button></div></div>:<div className="ep-dialog-body ef-payment-details">
   {storageFailed?<Notice error>{tr("Не удалось сохранить отметку. Не закрывайте страницу.", "Could not save the payment record. Keep this page open.")}</Notice>:notice&&<Notice>{notice}</Notice>}
   <p className="ex-status">{statusText()[payment.status]}</p><h3>{payment.serviceName}</h3>{payment.source!=='appointment'&&<p className="ep-muted">{tr("Заказ ", "Order ")}{payment.id}</p>}{appointment?.status==='cancelled'&&<p className="ex-note">{tr("Встреча отменена. Полученная оплата остаётся в истории; возврат денег оформляется отдельно.", "The appointment was cancelled. The payment remains in your history; refunds are handled separately.")}</p>}
   <p className="ef-payment-amount">{money(payment.amount)}</p>
   {payment.status==='pending'&&canReceive&&<button className="ep-button ep-button--primary ef-record-button" onClick={()=>{setStep('record');setNotice('');setError('')}}>{tr("Отметить оплату", "Record payment")}</button>}
   <dl className="ex-detail"><div><dt>{tr("Дата заказа", "Order date")}</dt><dd>{formatDate(payment.date)}</dd></div>{payment.status==='paid'&&<div><dt>{tr("Получено", "Received")}</dt><dd>{formatDate(paymentDate(payment))}</dd></div>}<div><dt>{tr("Комиссия", "Fee")}</dt><dd>{money(payment.commission)}</dd></div>{payment.status==='paid'&&<div><dt>{tr("После комиссии", "After fees")}</dt><dd>{money(payment.amount-payment.commission)}</dd></div>}</dl>
   <details className="ef-payment-history"><summary>{tr("История заказа", "Order history")}</summary><ol className="ex-history"><li>{payment.status==='paid'?`${formatDate(paymentDate(payment))} · ${payment.manualReceipt?tr("Получение оплаты отмечено вручную", "Payment recorded manually"):tr("Оплата получена", "Payment received")}`:payment.status==='pending'?tr("Ожидаем оплату клиента", "Awaiting client payment"):tr("Оплата возвращена", "Payment refunded")}</li><li>{formatDate(payment.date)} {tr(" · Заказ создан", " · Order created")}</li></ol></details>
   {hasClient&&<>{appointment&&<p className="ep-muted">{tr("Встреча: ", "Appointment: ")}{formatDate(appointment.date)} · {appointment.time}</p>}<div className="ep-actions">{appointment&&<button className="ep-button" onClick={()=>onOpenAppointment(appointment)}>{tr("Открыть встречу ", "View appointment ")}<Icon name="arrow"/></button>}<button className="ep-button" onClick={onOpenClient}>{tr("Открыть клиента", "View client")}</button></div></>}
   {payment.status==='paid'&&payment.manualReceipt&&<button className="ep-text-button ef-undo-payment" onClick={()=>{setStep('undo');setNotice('')}}>{tr("Отменить ошибочную отметку", "Undo an incorrect payment record")}</button>}
  </div>}
 </Dialog>
}

export function ServicesFinance({ section, practice, onOpenClient }: ModuleProps & { section: 'services' | 'finance' | 'analytics' }) {
 const learning=useLearning()
 const scope = useContext(ModuleScopeContext)
 const [services, setServices, serviceStorageFailed] = useModuleState<Service[]>('services', practice.isExample, () => practice.isExample ? DEFAULT_SERVICES : [])
 const [payments, setPayments, paymentStorageFailed] = useModuleState<Payment[]>('payments', practice.isExample, () => practice.isExample ? initialPayments() : [])
 const synchronizedPayments=synchronizeAppointmentPayments(payments,practice.appointments,TODAY,scope===MEMBER_SCOPE?memberPayments:[])
 useEffect(()=>{if(synchronizedPayments!==payments)setPayments(synchronizedPayments)},[payments,practice.appointments,scope])
 const activePayments=synchronizedPayments.filter(payment=>visibleAppointmentPayment(payment,practice.appointments))
 const [query, setQuery] = useModuleState<string>('services-query',practice.isExample,()=>''), [serviceStatus, setServiceStatus] = useModuleState<string>('services-filter',practice.isExample,()=>'all'), [period, setPeriod] = useModuleState<Period>(`${section}-period`,practice.isExample,()=>'month'), [paymentStatus, setPaymentStatus] = useModuleState<string>('finance-status',practice.isExample,()=>'all')
 const [paymentQuery, setPaymentQuery] = useModuleState<string>('finance-query', practice.isExample, () => '')
 const [paymentLimit, setPaymentLimit] = useModuleState<number>('finance-visible-count', practice.isExample, () => 12)
 const [clientLimit, setClientLimit] = useModuleState<number>('analytics-visible-clients', practice.isExample, () => 6)
 const [editor, setEditor] = useState<Service | 'new' | null>(null), [preview, setPreview] = useState<Service | null>(null), [operation, setOperation] = useState<Payment | null>(null), [notice, setNotice] = useState(''), [savedId, setSavedId] = useState('')
 useEffect(() => { if (savedId && !editor) document.getElementById(`service-${savedId}`)?.scrollIntoView({ block: 'nearest' }) }, [savedId, editor])
 const filteredServices = services.filter(s => (serviceStatus === 'all' || s.status === serviceStatus) && `${s.name} ${s.description}`.toLocaleLowerCase('ru-RU').includes(query.toLocaleLowerCase('ru-RU'))).sort((a, b) => Number(b.id === savedId) - Number(a.id === savedId))
 useEffect(()=>{
  if(section!=='finance')return
  const url=new URL(window.location.href),appointmentId=url.searchParams.get('paymentAppointment')
  if(!appointmentId)return
  const payment=activePayments.find(p=>p.appointmentId===appointmentId)
  if(payment){setOperation(payment);setPaymentQuery('');setPaymentStatus('all');setPeriod('all')}
  else setNotice(tr("Для этой встречи нет ожидаемой оплаты. Проверьте стоимость и статус встречи.", "No payment is pending for this appointment. Check its price and status."))
  url.searchParams.delete('paymentAppointment');window.history.replaceState(null,'',url)
 },[section,practice.appointments])
 const periodPayments = activePayments.filter(p => paymentDate(p) >= periodStart[period] && paymentDate(p) <= TODAY)
 const totals = paymentTotals(periodPayments)
 const clientName = (id: string) => practice.clients.find(c => c.id === id)?.name ?? tr("Клиент удалён", "Client deleted")
 const paymentSearch = paymentQuery.trim().toLocaleLowerCase('ru-RU')
 const shownPayments = periodPayments.filter(p => (paymentStatus === 'all' || p.status === paymentStatus) && `${clientName(p.clientId)} ${p.serviceName} ${p.id}`.toLocaleLowerCase('ru-RU').includes(paymentSearch)).sort((a, b) => paymentDate(b).localeCompare(paymentDate(a)) || b.id.localeCompare(a.id))
 const visiblePayments = shownPayments.slice(0, paymentLimit)
 const clearPaymentFilters = () => { setPaymentQuery(''); setPaymentStatus('all'); setPaymentLimit(12) }
 const rangeText = period === 'month' ? tr("1–15 октября 2026", "1–15 October 2026") : period === 'week' ? tr("9–15 октября 2026", "9–15 October 2026") : tr("Вся история до 15 октября 2026", "All history up to 15 October 2026")
 const periodSelect = <label>{tr("Период", "Period")}<Select aria-label={tr("Период отчёта", "Report period")} value={period} onChange={e => { setPeriod(e.target.value as Period);learning.complete('analytics'); setPaymentLimit(12); setClientLimit(6) }}><option value="month">{tr("Этот месяц", "This month")}</option><option value="week">{tr("Последние 7 дней", "Last 7 days")}</option><option value="all">{tr("Всё время", "All time")}</option></Select></label>
 const openClient = (id: string) => { setOperation(null); onOpenClient(id) }
 const relatedAppointment = operation ? paymentAppointment(operation, practice.appointments, scope === MEMBER_SCOPE ? memberPayments : []) : undefined
 const openAppointment = (appointment: Appointment) => { const url = new URL(window.location.href); url.searchParams.set('appointment', appointment.id); window.history.replaceState(window.history.state, '', url); openClient(appointment.clientId) }
 const paid = periodPayments.filter(p => p.status === 'paid')
 const popular = [...new Set(paid.map(p => p.serviceId))].map(id => { const rows = paid.filter(p => p.serviceId === id); return { id, name: rows[0].serviceName, count: rows.length, amount: paymentTotals(rows).net } }).sort((a, b) => b.count - a.count)
 const paidClientIds = [...new Set(paid.map(p => p.clientId))]
 if(section!=='services'&&!activePayments.length)return <><SectionHeader title={section==='finance'?tr("Оплаты", "Payments"):tr("Аналитика", "Analytics")}/>{notice&&<Notice>{notice}</Notice>}<EmptyState icon="wallet" title={section==='finance'?tr("Пока нет встреч к оплате", "No appointments awaiting payment"):tr("Пока недостаточно данных", "Not enough data yet")} action={<a className="ep-button" href="#calendar">{tr("Открыть календарь ", "Open calendar ")}<Icon name="arrow"/></a>}>{tr("Укажите стоимость при записи клиента на встречу. Здесь появится ожидаемая оплата — отметьте её, когда получите деньги.", "Set a price when booking an appointment. The pending payment will appear here. Record it once you receive the money.")}</EmptyState></>
 return <>
  {section === 'services' ? <>
   <SectionHeader title={tr("Услуги и цены", "Services and prices")} action={<button className="ep-button ep-button--primary" onClick={() => setEditor('new')}><Icon name="plus" />{tr("Создать услугу", "Create service")}</button>} />
   <div className="ex-toolbar"><label className="ep-search"><Icon name="search" /><input aria-label={tr("Найти услугу", "Find a service")} placeholder={tr("Найти услугу", "Find a service")} value={query} onChange={e => setQuery(e.target.value)} /></label><label>{tr("Показывать", "Show")}<Select aria-label={tr("Показывать услуги", "Show services")} value={serviceStatus} onChange={e => setServiceStatus(e.target.value)}><option value="all">{tr("Все услуги", "All services")}</option><option value="available">{tr("Доступные", "Available")}</option><option value="draft">{tr("Черновики", "Drafts")}</option></Select></label></div>
   {notice && <Notice>{notice}</Notice>}
   {filteredServices.length ? <div className="ex-list">{filteredServices.map(service => <article className="ex-row" id={`service-${service.id}`} key={service.id}><div><span className="ex-status">{service.status === 'draft' ? tr("Черновик", "Draft") : tr("Доступна", "Available")}</span><h2>{service.name}</h2>{service.id === savedId && <span className="ep-muted">{tr("Только что сохранено", "Just saved")}</span>}<p>{service.description}</p><p className="ep-muted">{service.duration} {tr(" минут · ", " min · ")}{countLabel(service.includes.length,[tr("результат", "item"),tr("результата", "items"),tr("результатов", "items")])} · {money(service.price)}</p></div><div className="ep-actions"><button className="ep-button" onClick={() => setPreview(service)}>{tr("Глазами клиента", "Client preview")}</button><button className="ep-button" onClick={() => setEditor(service)}>{tr("Изменить", "Edit")}</button></div></article>)}</div> : <EmptyState icon={services.length?'search':'service'} title={services.length ? tr("Услуги не найдены", "No services found") : tr("Начните с одной услуги", "Start with one service")}>{services.length ? tr("Попробуйте другое название или измените фильтр.", "Try another name or change the filter.") : tr("Дайте ей понятное название и опишите результат. Сложный каталог не нужен.", "Give it a clear name and describe what the client receives. One service is enough to get started.")}</EmptyState>}
  </> : <>
   <SectionHeader title={section === 'finance' ? tr("Оплаты", "Payments") : tr("Аналитика", "Analytics")} />
   {notice&&!operation&&<Notice>{notice}</Notice>}
   <div className="ex-toolbar">{periodSelect}<p className="ep-muted">{rangeText}</p></div>

   {section === 'finance' ? <>
    <section className="ef-finance-summary" aria-label={tr("Итоги оплат за выбранный период", "Payment summary for the selected period")}><div className="ef-finance-gross"><span>{tr("Поступило", "Received")}</span><strong>{money(totals.gross)}</strong></div><details className="ef-finance-breakdown"><summary>{tr("Комиссия и итог", "Fees and total")}</summary><dl><div><dt>{tr("Комиссия", "Fee")}</dt><dd>{money(totals.fee)}</dd></div><div><dt>{tr("После комиссии", "After fees")}</dt><dd>{money(totals.net)}</dd></div></dl><p>{tr("Учитываются только оплаченные заказы за выбранный период.", "Only paid orders in the selected period are included.")}</p></details></section>
    <h2>{tr("Операции", "Transactions")}</h2>
    <div className="ex-toolbar ex-payment-toolbar"><label className="ep-search"><Icon name="search" /><input aria-label={tr("Найти операцию", "Find a transaction")} placeholder={tr("Клиент, услуга или номер", "Client, service or reference")} value={paymentQuery} onChange={e => { setPaymentQuery(e.target.value); setPaymentLimit(12) }} /></label><label>{tr("Статус", "Status")}<Select aria-label={tr("Статус оплаты", "Payment status")} value={paymentStatus} onChange={e => { setPaymentStatus(e.target.value); setPaymentLimit(12) }}><option value="all">{tr("Все операции", "All transactions")}</option><option value="paid">{tr("Оплачено", "Paid")}</option><option value="pending">{tr("Ждём оплату", "Awaiting payment")}</option><option value="refunded">{tr("Возвращено", "Refunded")}</option></Select></label></div>
    <p className="ep-muted">{tr("Сумма поступлений — за выбранный период, независимо от поиска и статуса.", "Income covers the selected period, regardless of search and status filters.")}</p>
    <div className="ex-payment-results"><p className="ep-muted" role="status">{countLabel(shownPayments.length, [tr("операция", "transaction"), tr("операции", "transactions"), tr("операций", "transactions")])}{shownPayments.length > visiblePayments.length ? tr(` · показано ${visiblePayments.length}`, ` · showing ${visiblePayments.length}`) : ''}</p>{(paymentSearch || paymentStatus !== 'all') && <button className="ep-text-button" onClick={clearPaymentFilters}>{tr("Сбросить фильтры", "Clear filters")}</button>}</div>
    {shownPayments.length ? <><div className="ex-list ex-payment-list">{visiblePayments.map(payment => <button className="ex-row ex-row-button ex-payment-row" key={payment.id} onClick={() => setOperation(payment)}><div className="ex-payment-info"><strong>{clientName(payment.clientId)}</strong><p>{payment.serviceName}</p><small>{formatDate(paymentDate(payment))}{payment.source!=='appointment'&&` · ${payment.id}`}</small></div><div className="ex-payment-total"><strong>{money(payment.amount)}</strong><p className="ex-status">{statusText()[payment.status]}</p><span>{payment.status==='pending'?tr("Отметить оплату", "Record payment"):tr("Подробнее", "View details")} <Icon name="arrow" size={16} /></span></div></button>)}</div>{shownPayments.length > paymentLimit && <div className="ex-list-more"><button className="ep-button" onClick={() => setPaymentLimit(count => count + 12)}>{tr("Показать ещё ", "Show more ")}{Math.min(12, shownPayments.length - paymentLimit)}</button><span className="ep-muted">{tr("Показано ", "Showing ")}{visiblePayments.length} {tr(" из ", " of ")}{shownPayments.length}</span></div>}</> : <EmptyState icon={paymentSearch?'search':'wallet'} title={paymentSearch ? tr("Операции не найдены", "No transactions found") : paymentStatus !== 'all' ? tr("Нет операций с таким статусом", "No transactions with this status") : tr("Нет операций за этот период", "No transactions in this period")} action={(paymentSearch || paymentStatus !== 'all') ? <button className="ep-button" onClick={clearPaymentFilters}>{tr("Сбросить фильтры", "Clear filters")}</button> : undefined}>{paymentSearch ? tr("Попробуйте имя клиента, название услуги или номер операции. Можно сбросить поиск и статус.", "Try a client name, service name or transaction reference. You can also clear the search and status filters.") : paymentStatus !== 'all' ? tr("Сбросьте статус или выберите другой период.", "Clear the status filter or select another period.") : tr("Выберите другой период, чтобы посмотреть историю оплат.", "Select another period to view payment history.")}</EmptyState>}

   </> : <div className="ex-list">
    <section className="ex-panel"><h2>{tr("Доход после комиссии", "Income after fees")}</h2><p className="ex-amount">{money(totals.net)}</p><p>{tr("После комиссии · ", "After fees · ")}{countLabel(paid.length,[tr("оплата", "payment"),tr("оплаты", "payments"),tr("оплат", "payments")])} {tr(" за выбранный период", " in the selected period")}</p><details><summary>{tr("Из чего складывается сумма", "How this amount is calculated")}</summary><dl className="ex-detail"><div><dt>{tr("Поступило", "Received")}</dt><dd>{money(totals.gross)}</dd></div><div><dt>{tr("Комиссия", "Fee")}</dt><dd>−{money(totals.fee)}</dd></div><div><dt>{tr("После комиссии", "After fees")}</dt><dd>{money(totals.net)}</dd></div></dl><p className="ep-muted">{tr("Ожидаемые и возвращённые платежи не включены.", "Pending and refunded payments are excluded.")}</p></details></section>
    <section className="ex-panel"><h2>{tr("Оплаченные услуги", "Paid services")}</h2>{popular.length ? <div className="ex-list">{popular.map(item => <div className="ex-row ex-analytics-service" key={item.id}><div><strong>{item.name}</strong><p>{tr("Оплаченных заказов: ", "Paid orders: ")}{item.count}</p></div><strong>{money(item.amount)}</strong></div>)}</div> : <p className="ep-muted">{tr("Пока нет оплаченных заказов за этот период.", "No paid orders in this period yet.")}</p>}<p className="ep-muted">{tr("Учитываем только оплаченные услуги. Суммы указаны после комиссии.", "Only paid services are included. Amounts are shown after fees.")}</p></section>
    <section className="ex-panel"><h2>{tr("Заказы по клиентам", "Orders by client")}</h2>{paidClientIds.length ? <div className="ex-list">{paidClientIds.slice(0, clientLimit).map(id => { const count = paid.filter(p => p.clientId === id).length; return <div className="ex-row" key={id}><div><strong>{clientName(id)}</strong><p>{countLabel(count, [tr("оплаченный заказ", "paid order"), tr("оплаченных заказа", "paid orders"), tr("оплаченных заказов", "paid orders")])} {tr(" за период", " in this period")}</p></div>{practice.clients.some(c => c.id === id) && <button className="ep-button" onClick={() => openClient(id)}>{tr("Открыть клиента", "View client")}</button>}</div> })}</div> : <p className="ep-muted">{tr("Клиенты появятся здесь после первой оплаты.", "Clients will appear here after their first payment.")}</p>}{paidClientIds.length > clientLimit && <div className="ex-list-more"><button className="ep-button" onClick={() => setClientLimit(count => count + 6)}>{tr("Показать ещё ", "Show more ")}{Math.min(6, paidClientIds.length - clientLimit)}</button><span className="ep-muted">{tr("Показано ", "Showing ")}{Math.min(clientLimit, paidClientIds.length)} {tr(" из ", " of ")}{paidClientIds.length}</span></div>}</section>
   </div>}
  </>}
  {(serviceStorageFailed || paymentStorageFailed) && <Notice error>{tr("Не удалось сохранить изменения. Не закрывайте страницу и попробуйте ещё раз.", "Could not save changes. Keep this page open and try again.")}</Notice>}
  {editor && <ServiceEditor service={editor === 'new' ? undefined : editor} existing={services} onClose={() => setEditor(null)} onSave={service => { setServices(old => old.some(s => s.id === service.id) ? old.map(s => s.id === service.id ? service : s) : [...old, service]); setEditor(null); setQuery(''); setServiceStatus('all'); setSavedId(service.id); learning.complete('services'); setNotice(tr(`«${service.name}» сохранена.`, `“${service.name}” saved.`)) }} />}
  {preview && <Dialog title={tr("Как услугу видит клиент", "Service preview for clients")} onClose={() => setPreview(null)}><div className="ep-dialog-body"><p className="ep-eyebrow">{practice.profile.name} {tr(" · Консультация", " · Consultation")}</p><h2>{preview.name}</h2><p>{preview.description}</p><p><strong>{money(preview.price)}</strong> · {preview.duration} {tr(" минут", " min")}</p><h3>{tr("Что вы получите", "What you will receive")}</h3><ul className="ex-service-includes">{preview.includes.map(item => <li key={item}>{item}</li>)}</ul><p className="ex-note">{preview.status === 'draft' ? tr("Это черновик. Клиенты пока его не видят.", "This is a draft. Clients cannot see it yet.") : tr("Предпросмотр предложения для клиента.", "Preview of your offer to clients.")}</p><button className="ep-button" onClick={() => { setPreview(null); setEditor(preview) }}>{tr("Вернуться к редактированию", "Back to editing")}</button></div></Dialog>}
  {operation && <PaymentDetails key={operation.id} storageFailed={paymentStorageFailed} payment={operation} clientName={clientName(operation.clientId)} hasClient={practice.clients.some(c=>c.id===operation.clientId)} appointment={relatedAppointment} onClose={()=>setOperation(null)} onOpenClient={()=>openClient(operation.clientId)} onOpenAppointment={openAppointment} onSave={next=>{setPayments(items=>items.map(p=>p.id===next.id?next:p));const visible=visibleAppointmentPayment(next,practice.appointments);setOperation(visible?next:null);if(next.status==='paid')learning.complete('finance');setNotice(next.status==='paid'?tr(`Оплата учтена: ${clientName(next.clientId)} · ${money(next.amount)}.`, `Payment recorded: ${clientName(next.clientId)} · ${money(next.amount)}.`):visible?tr("Отметка отменена. Заказ снова ожидает оплаты.", "Payment record undone. The order is awaiting payment again."):tr("Отметка отменена. По этой встрече оплату больше не ожидаем.", "Payment record undone. No payment is expected for this appointment."))}}/>}
 </>
}
