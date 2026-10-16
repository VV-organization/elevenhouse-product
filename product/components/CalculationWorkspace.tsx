import {useState, type FormEvent} from 'react'
import {ClientForm} from './Forms'
import {ClientPicker} from './ClientPicker'
import {Chart} from './Chart'
import {Icon} from './Icon'
import {LearningTip, useLearning} from './Learning'
import {Notice, useModuleState} from '../modules/ModuleKit'
import {formatDate, TODAY, type Practice} from '../state/model'
import {birthDataError, birthDataOf, emptyBirthData, hasSavedNatalChart, type BirthData, type BirthDraft, resolveBirthDraft} from '../state/calculationData'
import '../calculation.css'

type Props = {practice: Practice; clientId?: string; onChange?: (practice: Practice) => void; onOpenClient: (id: string) => void}
const methods = [{id:'natal', name:'Натальная карта'}, {id:'numbers', name:'Нумерология'}, {id:'matrix', name:'Матрица'}] as const
type Method = typeof methods[number]['id']
export function CalculationWorkspace(props: Props) {
  const [mode, setMode] = useModuleState<'client'|'quick'>('calculation-mode', props.practice.isExample, () => props.practice.clients.length ? 'client' : 'quick')
  const [selectedId, setSelectedId] = useModuleState<string>('calculations-client', props.practice.isExample, () => props.practice.clients[0]?.id || '')
  const effectiveMode = props.clientId ? 'client' : props.practice.clients.length ? mode : 'quick'
  const selected = props.clientId || (props.practice.clients.some(client => client.id === selectedId) ? selectedId : props.practice.clients[0]?.id)
  return <section className="ec-workspace" aria-label="Расчёт и подготовка">
    {!props.clientId && props.practice.clients.length>0 && <><div className="ec-mode" role="group" aria-label="Для кого расчёт"><button aria-pressed={mode === 'client'} onClick={() => setMode('client')}>Из моих клиентов</button><button aria-pressed={mode === 'quick'} onClick={() => setMode('quick')}>Без добавления клиента</button></div>{effectiveMode === 'client' && <div className="ec-client">{props.practice.clients.length ? <><ClientPicker clients={props.practice.clients} value={selected || ''} onChange={setSelectedId}/><button className="ep-text-button" onClick={() => selected && props.onOpenClient(selected)}>Карточка клиента <Icon name="arrow" size={16}/></button></> : <p>Клиентов пока нет. <button className="ep-text-button" onClick={() => setMode('quick')}>Ввести данные рождения</button></p>}</div>}</>}
    {(effectiveMode === 'quick' || selected) && <CalculationBody key={effectiveMode === 'quick' ? 'quick' : selected} {...props} clientId={effectiveMode === 'client' ? selected : undefined}/>}
  </section>
}
function CalculationBody({practice, clientId, onChange, onOpenClient}: Props) {
  const learning = useLearning()
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
  const [method, setMethod] = useState<Method>('natal')
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
  const chart = method === 'natal' && hasSavedNatalChart(client, practice.isExample)
  function saveData(event: FormEvent) {
    event.preventDefault()
    const problem = birthDataError(draft)
    if (problem) return setError(problem)
    const data = {...birthDataOf(draft), birthPlace:draft.birthPlace.trim()}
    if (client) {
      if (!onChange) return setError('Не удалось сохранить данные. Откройте карточку клиента и повторите попытку.')
      onChange({...practice, clients:practice.clients.map(item => item.id === client.id ? {...item, ...data, updatedAt:new Date().toISOString()} : item)})
    } else setQuick(data)
    clearBirthDraft(); learning.complete('calculations'); setDraft(data); setEditing(false); setError(''); setSaved(client ? 'Данные рождения сохранены в карточке клиента.' : 'Данные сохранены. К ним можно вернуться в этом разделе.')
  }
  return <>
    {!editing && <LearningTip topic="calculations">{client?'Данные клиента подставлены. При необходимости нажмите «Изменить данные».':'Данные сохранены. Можно добавить клиента — дата, время, место и заметки перенесутся в его карточку.'}</LearningTip>}
    {recovered.conflict && <details className="ec-draft-recovery"><summary>Сохранён незавершённый ввод</summary><p>Данные в карточке изменились после начала ввода. Текущие данные сохранены; черновик можно открыть отдельно.</p><p>{formatDate(birthDrafts[draftKey].data.birthDate)} · {birthDrafts[draftKey].data.unknownTime ? 'Время неизвестно' : birthDrafts[draftKey].data.birthTime || 'Время не указано'} · {birthDrafts[draftKey].data.birthPlace || 'Город не указан'}</p><div className="ec-actions"><button className="ep-button" onClick={() => {changeDraft(birthDrafts[draftKey].data);setEditing(true);setRestored(true)}}>Продолжить с черновиком</button><button className="ep-text-button" onClick={clearBirthDraft}>Удалить черновик</button></div></details>}
    {editing ? <form className="ep-form ec-birth-form" onSubmit={saveData}>
      <h2>Данные рождения</h2>{restored && <p className="ep-muted" role="status">Продолжите незавершённый ввод. Данные в карточке обновятся после сохранения.</p>}
      <div className="ec-birth-fields"><label>Дата рождения<input type="date" max={TODAY} required value={draft.birthDate} onChange={event => changeDraft({...draft, birthDate:event.target.value})}/></label><div><label>Время рождения<input type="time" required={!draft.unknownTime} disabled={draft.unknownTime} value={draft.birthTime} onChange={event => changeDraft({...draft, birthTime:event.target.value})}/></label><label className="ec-checkbox"><input type="checkbox" checked={draft.unknownTime} onChange={event => changeDraft({...draft, unknownTime:event.target.checked, birthTime:event.target.checked ? '' : draft.birthTime})}/>Время неизвестно</label></div><label>Город и страна<input required value={draft.birthPlace} onChange={event => changeDraft({...draft, birthPlace:event.target.value})} placeholder="Москва, Россия" autoComplete="off"/></label></div>
      <p className="ep-muted">Укажите местное время в городе рождения. Если время неизвестно, точные дома и асцендент определить нельзя.</p>
      {error && <Notice error>{error}</Notice>}
      <LearningTip topic="calculations">Сохраните данные рождения. Для клиента они обновятся и в его карточке. При неизвестном времени отметьте это в форме.</LearningTip>
      <div className="ec-actions"><button className="ep-button ep-button--primary">Сохранить данные</button>{!birthDataError(source) && <button type="button" className="ep-button" onClick={() => {clearBirthDraft();setDraft(source);setEditing(false);setError('')}}>Отмена</button>}</div>
    </form> : <div className="ec-birth-summary"><div><strong>{client?.name || 'Данные рождения'}</strong><p>{formatDate(source.birthDate)} · {source.unknownTime ? 'Время неизвестно' : source.birthTime}<br/>{source.birthPlace}</p></div><button className="ep-text-button" onClick={() => {setDraft(source);setEditing(true);setSaved('')}}>Изменить данные</button></div>}
    {saved && <Notice>{saved}</Notice>}
    {!editing&&!client&&onChange&&<div className="ec-actions ec-save-client"><button className="ep-button" onClick={()=>{learning.start('client');setAddingClient(true)}}>Сохранить как клиента <Icon name="arrow" size={16}/></button><p className="ep-muted">Данные рождения и заметки перенесутся в карточку.</p></div>}
    {addingClient&&<ClientForm practice={practice} initialData={{...source,notes:noteText}} onClose={()=>{learning.pause();setAddingClient(false)}} onSave={(next,id)=>{onChange?.(next);learning.complete('client');setAddingClient(false);onOpenClient(id)}}/>}
    {birthDraftFailed && <Notice error>Не удалось сохранить незавершённый ввод. Не закрывайте страницу до сохранения данных.</Notice>}
    {quickFailed && !client && <Notice error>Не удалось сохранить данные. Не закрывайте страницу, пока не скопируете их.</Notice>}
    {!editing && <><details className="ec-methods"><summary>Метод: {methods.find(item => item.id === method)?.name}</summary><div className="ec-mode" role="group" aria-label="Метод работы">{methods.map(item => <button key={item.id} aria-pressed={method === item.id} onClick={() => setMethod(item.id)}>{item.name}</button>)}</div></details>
      {chart ? <div className="ec-chart"><Chart/></div> : <div className="ec-result"><h2>{method === 'natal' ? 'Карта ещё не рассчитана' : `${methods.find(item => item.id === method)?.name}: материалы к разбору`}</h2><p>{method === 'natal' ? 'Для этих данных пока нет готового расчёта. Можно сохранить вопросы и наблюдения к консультации.' : 'Сохраните вопросы и наблюдения по своей методике. Ваши памятки доступны в разделе «Мои материалы».'}</p>{source.unknownTime && method === 'natal' && <p className="ep-muted">Время рождения неизвестно — точные дома и асцендент недоступны.</p>}{method !== 'natal' && <a className="ep-text-button" href="#library">Открыть мои материалы <Icon name="arrow" size={16}/></a>}</div>}
      <section className="ep-form ec-preparation"><label htmlFor="calculation-note">Заметки к разбору <span className="ep-muted">· только вам</span></label><textarea id="calculation-note" rows={4} value={noteText} readOnly={!!client && !onChange} placeholder="На что обратить внимание при подготовке" onChange={event => saveNote(event.target.value)}/><p className="ep-muted">Сохраняются автоматически{client ? ' в заметках клиента' : ''}.</p>{notesFailed && <Notice error>Не удалось сохранить заметки. Скопируйте текст перед закрытием страницы.</Notice>}
      {legacyNote !== undefined && <details className="ec-draft-recovery"><summary>Ранее сохранённый черновик заметки</summary><p>Текущие заметки сохранены выше. Этот черновик можно добавить к ним или удалить.</p><p style={{whiteSpace:'pre-wrap'}}>{legacyNote || 'Пустой черновик'}</p><div className="ec-actions">{legacyNote.trim() && <button className="ep-button" disabled={!onChange} onClick={() => {saveNote([client?.notes,legacyNote].filter(Boolean).join('\n\n'));discardLegacyNote()}}>Добавить к текущим заметкам</button>}<button className="ep-text-button" onClick={discardLegacyNote}>Удалить черновик</button></div></details>}</section>
    </>}
  </>
}
