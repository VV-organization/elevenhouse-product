import type {CalculateAstronomy} from '../state/calculationPresentation'
import type {InterpretCalculation} from '../state/calculationDelivery'
import {tr} from '../i18n'
import {useState, useEffect, type FormEvent} from 'react'
import {ClientForm} from './Forms'
import {ClientPicker} from './ClientPicker'
import {MethodCalculations} from './MethodCalculations'
import {AstronomyCalculations} from './AstronomyCalculations'
import {Icon} from './Icon'
import {LearningTip, useLearning} from './Learning'
import {Notice, useModuleState} from '../modules/ModuleKit'
import {formatDate, TODAY, type Practice} from '../state/model'
import {birthDataError, birthDataOf, emptyBirthData, hasSavedNatalChart, type BirthData, type BirthDraft, resolveBirthDraft} from '../state/calculationData'
import '../calculation.css'
import '../calculation-organization.css'

export type CalculationAdapters = {calculate?: CalculateAstronomy; interpret?: InterpretCalculation}
type Props = CalculationAdapters & {methodRoutes?:boolean;initialMethod?:'natal'|'numbers'|'matrix'|'hd';practice: Practice; clientId?: string; onChange?: (practice: Practice) => void; onOpenClient: (id: string) => void; compactSummary?:boolean}
const getMethods = () => [{id:'natal', name:tr("Астрология", "Astrology")}, {id:'numbers', name:tr("Нумерология", "Numerology")}, {id:'matrix', name:tr("Матрица судьбы", "Destiny matrix")}, {id:'hd', name:tr("Дизайн человека", "Human Design")}] as const
type Method = ReturnType<typeof getMethods>[number]['id']
export function CalculationWorkspace(props: Props) {
  const [mode, setMode] = useModuleState<'client'|'quick'>('calculation-mode', props.practice.isExample, () => props.practice.clients.length ? 'client' : 'quick')
  const [selectedId, setSelectedId] = useModuleState<string>('calculations-client', props.practice.isExample, () => props.practice.clients[0]?.id || '')
  useEffect(()=>{const select=()=>{if(new URLSearchParams(window.location.search).get('savedCalculation')?.startsWith('quick:'))setMode('quick')};select();window.addEventListener('hashchange',select);return()=>window.removeEventListener('hashchange',select)},[])
  const effectiveMode = props.clientId ? 'client' : props.practice.clients.length ? mode : 'quick'
  const selected = props.clientId || (props.practice.clients.some(client => client.id === selectedId) ? selectedId : props.practice.clients[0]?.id)
  return <section className="ec-workspace" aria-label={tr("Расчёт и подготовка", "Calculation and preparation")}>
    {!props.clientId && props.practice.clients.length>0 && <div className="ec-subject-bar"><div className="ec-mode" role="group" aria-label={tr("Для кого расчёт", "Who is this calculation for?")}><button aria-pressed={mode === 'client'} onClick={() => setMode('client')}>{tr("Из моих клиентов", "Choose a client")}</button><button aria-pressed={mode === 'quick'} onClick={() => setMode('quick')}>{tr("Без добавления клиента", "Without adding a client")}</button></div>{effectiveMode === 'client' && <div className="ec-client">{props.practice.clients.length ? <><ClientPicker clients={props.practice.clients} value={selected || ''} onChange={setSelectedId}/><button className="ep-text-button" onClick={() => selected && props.onOpenClient(selected)}>{tr("Карточка клиента", "Client profile")} <Icon name="arrow" size={16}/></button></> : <p>{tr("Клиентов пока нет.", "No clients yet.")} <button className="ep-text-button" onClick={() => setMode('quick')}>{tr("Ввести данные рождения", "Enter birth details")}</button></p>}</div>}</div>}
    {(effectiveMode === 'quick' || selected) && <CalculationBody key={effectiveMode === 'quick' ? 'quick' : selected} {...props} clientId={effectiveMode === 'client' ? selected : undefined} compactSummary={!props.clientId && effectiveMode === 'client'}/>}
  </section>
}
function CalculationBody({compactSummary,methodRoutes,initialMethod,practice, clientId, onChange, onOpenClient, calculate, interpret}: Props) {
  const learning = useLearning()
  const methods = getMethods()
  const [addingClient,setAddingClient]=useState(false)
  const client = practice.clients.find(item => item.id === clientId)
  const [quick, setQuick, quickFailed] = useModuleState<BirthData>('quick-calculation-data', practice.isExample, () => emptyBirthData)
  const source = client ? birthDataOf(client) : quick
  const draftKey = clientId || 'quick'
  const [birthDrafts, setBirthDrafts, birthDraftFailed] = useModuleState<Record<string,BirthDraft>>('calculation-birth-drafts', practice.isExample, () => ({}))
  const recovered = resolveBirthDraft(source, birthDrafts[draftKey])
  const [draft, setDraft] = useState<BirthData>(recovered.data)
  const [restored, setRestored] = useState(recovered.restored)
  const [editing, setEditing] = useState(recovered.restored || !!birthDataError(source))
  function changeDraft(value: BirthData) {setDraft(value);setBirthDrafts(old => ({...old,[draftKey]:{data:value,source}}))}
  function clearBirthDraft() {setBirthDrafts(old => {const next={...old};delete next[draftKey];return next});setRestored(false)}
  const requestedMethod=()=>{if(initialMethod)return initialMethod;const value=new URLSearchParams(window.location.search).get('calculationMethod');return methods.some(m=>m.id===value)?value as Method:'natal'}
  const [method, setMethod] = useState<Method>(requestedMethod)
  useEffect(()=>{const select=()=>{if(new URLSearchParams(window.location.search).has('calculationMethod'))setMethod(requestedMethod())};window.addEventListener('hashchange',select);return()=>window.removeEventListener('hashchange',select)},[])
  const [error, setError] = useState(''), [saved, setSaved] = useState('')
  const [notes, setNotes, notesFailed] = useModuleState<Record<string,string>>('calculation-notes', practice.isExample, () => ({}))
  const noteKey = clientId || 'quick'
  const legacyNote = client && notes[client.id] !== undefined && notes[client.id] !== client.notes ? notes[client.id] : undefined
  const noteText = client ? client.notes : notes.quick || ''
  function saveNote(value: string) {
    if (client && notes[client.id] === client.notes) discardLegacyNote()
    if (client && onChange) onChange({...practice,clients:practice.clients.map(item => item.id === client.id ? {...item,notes:value,updatedAt:new Date().toISOString()} : item)})
    else if (!client) setNotes(old => ({...old,quick:value}))
    learning.complete('notes')
  }
  function discardLegacyNote() {setNotes(old => {const next={...old};delete next[noteKey];return next})}
  const chart = hasSavedNatalChart(client, practice.isExample)
  function saveData(event: FormEvent) {
    event.preventDefault()
    const problem = birthDataError(draft)
    if (problem) return setError(problem)
    const data = {...birthDataOf(draft), birthPlace:draft.birthPlace.trim()}
    if (client) {
      if (!onChange) return setError(tr("Не удалось сохранить данные. Откройте карточку клиента и повторите попытку.", "Could not save the details. Open the client profile and try again."))
      onChange({...practice, clients:practice.clients.map(item => item.id === client.id ? {...item, ...data, updatedAt:new Date().toISOString()} : item)})
    } else setQuick(data)
    clearBirthDraft(); learning.complete('calculations'); setDraft(data); setEditing(false); setError(''); setSaved(client ? tr("Данные рождения сохранены в карточке клиента.", "Birth details saved to the client profile.") : tr("Данные сохранены. К ним можно вернуться в этом разделе.", "Details saved. You can return to them here."))
  }
  return <>
    <div className="ec-mode ec-methods" role="group" aria-label={tr("Метод работы", "Calculation method")}>{methods.map(item => <button key={item.id} aria-pressed={method === item.id} onClick={() => {if(methodRoutes){const url=new URL(window.location.href);url.searchParams.delete('calculationMethod');url.hash=item.id==='natal'?'tools':item.id;window.location.href=url.toString()}else setMethod(item.id)}}>{item.name}</button>)}</div>
    {!editing && <LearningTip topic="calculations">{client?tr("Данные клиента подставлены. При необходимости нажмите «Изменить данные».", "The client's details are filled in. Select “Edit details” if needed."):tr("Данные сохранены. Можно добавить клиента — дата, время, место и заметки перенесутся в его карточку.", "Details saved. Add a client to transfer the date, time, place and notes to their profile.")}</LearningTip>}
    {recovered.conflict && <details className="ec-draft-recovery"><summary>{tr("Сохранён незавершённый ввод", "Unfinished draft saved")}</summary><p>{tr("Данные в карточке изменились после начала ввода. Текущие данные сохранены; черновик можно открыть отдельно.", "The profile details changed after you started editing. The current details are saved; you can open your draft separately.")}</p><p>{formatDate(birthDrafts[draftKey].data.birthDate)} · {birthDrafts[draftKey].data.unknownTime ? tr("Время неизвестно", "Time unknown") : birthDrafts[draftKey].data.birthTime || tr("Время не указано", "Time not entered")} · {birthDrafts[draftKey].data.birthPlace || tr("Город не указан", "City not entered")}</p><div className="ec-actions"><button className="ep-button" onClick={() => {changeDraft(birthDrafts[draftKey].data);setEditing(true);setRestored(true)}}>{tr("Продолжить с черновиком", "Continue with draft")}</button><button className="ep-text-button" onClick={clearBirthDraft}>{tr("Удалить черновик", "Delete draft")}</button></div></details>}
    {editing ? <form className="ep-form ec-birth-form" onSubmit={saveData}>
      <h2>{tr("Данные рождения", "Birth details")}</h2>{restored && <p className="ep-muted" role="status">{tr("Продолжите незавершённый ввод. Данные в карточке обновятся после сохранения.", "Continue your draft. The profile will be updated when you save.")}</p>}
      <div className="ec-birth-fields"><label>{tr("Дата рождения", "Date of birth")}<input type="date" max={TODAY} required value={draft.birthDate} onChange={event => changeDraft({...draft, birthDate:event.target.value})}/></label><div><label>{tr("Время рождения", "Time of birth")}<input type="time" required={!draft.unknownTime} disabled={draft.unknownTime} value={draft.birthTime} onChange={event => changeDraft({...draft, birthTime:event.target.value})}/></label><label className="ec-checkbox"><input type="checkbox" checked={draft.unknownTime} onChange={event => changeDraft({...draft, unknownTime:event.target.checked, birthTime:event.target.checked ? '' : draft.birthTime})}/>{tr("Время неизвестно", "Time unknown")}</label></div><label>{tr("Город и страна", "City and country")}<input required value={draft.birthPlace} onChange={event => changeDraft({...draft, birthPlace:event.target.value})} placeholder={tr("Москва, Россия", "London, United Kingdom")} autoComplete="off"/></label></div>
      <p className="ep-muted">{tr("Укажите местное время в городе рождения. Если время неизвестно, точные дома и асцендент определить нельзя.", "Enter the local time in the birth city. Without a known birth time, exact houses and ascendant cannot be determined.")}</p>
      {error && <Notice error>{error}</Notice>}
      <LearningTip topic="calculations">{tr("Сохраните данные рождения. Для клиента они обновятся и в его карточке. При неизвестном времени отметьте это в форме.", "Save the birth details to update the client profile too. If the time is unknown, select that option in the form.")}</LearningTip>
      <div className="ec-actions"><button className="ep-button ep-button--primary">{tr("Сохранить данные", "Save details")}</button>{!birthDataError(source) && <button type="button" className="ep-button" onClick={() => {clearBirthDraft();setDraft(source);setEditing(false);setError('')}}>{tr("Отмена", "Cancel")}</button>}</div>
    </form> : <div className="ec-birth-summary"><div>{!compactSummary && <strong>{client?.name || tr("Данные рождения", "Birth details")}</strong>}<p>{formatDate(source.birthDate)} · {source.unknownTime ? tr("Время неизвестно", "Time unknown") : source.birthTime} · {source.birthPlace}</p></div><button className="ep-text-button" onClick={() => {setDraft(source);setEditing(true);setSaved('')}}>{tr("Изменить данные", "Edit details")}</button></div>}
    {saved && <Notice>{saved}</Notice>}
    {!editing&&!client&&onChange&&<div className="ec-actions ec-save-client"><button className="ep-button" onClick={()=>{learning.start('client');setAddingClient(true)}}>{tr("Сохранить как клиента", "Save as a client")} <Icon name="arrow" size={16}/></button><p className="ep-muted">{tr("Данные рождения и заметки перенесутся в карточку.", "Birth details and notes will be transferred to the profile.")}</p></div>}
    {addingClient&&<ClientForm practice={practice} initialData={{...source,notes:noteText}} onClose={()=>{learning.pause();setAddingClient(false)}} onSave={(next,id)=>{onChange?.(next);learning.complete('client');setAddingClient(false);onOpenClient(id)}}/>}
    {birthDraftFailed && <Notice error>{tr("Не удалось сохранить незавершённый ввод. Не закрывайте страницу до сохранения данных.", "Could not save the draft. Keep this page open until the details are saved.")}</Notice>}
    {quickFailed && !client && <Notice error>{tr("Не удалось сохранить данные. Не закрывайте страницу, пока не скопируете их.", "Could not save the details. Copy them before closing this page.")}</Notice>}
    {!editing && <>
      {method==='numbers'||method==='matrix'?<MethodCalculations interpret={interpret} key={method} method={method} date={source.birthDate} name={client?.name||''} practice={practice} clientId={clientId}/>:<AstronomyCalculations calculate={calculate} interpret={interpret} key={method} method={method} source={source} practice={practice} clientId={clientId} reference={chart}/>}
      <section className="ep-form ec-preparation"><label htmlFor="calculation-note">{tr("Заметки к разбору", "Appointment notes")} <span className="ep-muted">{tr("· только вам", "· private")}</span></label><textarea id="calculation-note" rows={4} value={noteText} readOnly={!!client && !onChange} placeholder={tr("На что обратить внимание при подготовке", "What to focus on during preparation")} onChange={event => saveNote(event.target.value)}/><p className="ep-muted">{tr("Сохраняются автоматически", "Saved automatically")}{client ? tr(" в заметках клиента", " to the client's notes") : ''}.</p>{notesFailed && <Notice error>{tr("Не удалось сохранить заметки. Скопируйте текст перед закрытием страницы.", "Could not save the notes. Copy the text before closing this page.")}</Notice>}
      {legacyNote !== undefined && <details className="ec-draft-recovery"><summary>{tr("Ранее сохранённый черновик заметки", "Previously saved note draft")}</summary><p>{tr("Текущие заметки сохранены выше. Этот черновик можно добавить к ним или удалить.", "Your current notes are saved above. You can add this draft to them or delete it.")}</p><p style={{whiteSpace:'pre-wrap'}}>{legacyNote || tr("Пустой черновик", "Empty draft")}</p><div className="ec-actions">{legacyNote.trim() && <button className="ep-button" disabled={!onChange} onClick={() => {saveNote([client?.notes,legacyNote].filter(Boolean).join('\n\n'));discardLegacyNote()}}>{tr("Добавить к текущим заметкам", "Add to current notes")}</button>}<button className="ep-text-button" onClick={discardLegacyNote}>{tr("Удалить черновик", "Delete draft")}</button></div></details>}</section>
    </>}
  </>
}
