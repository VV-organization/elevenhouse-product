import { useEffect, useId, useRef, useState, type KeyboardEvent, type SelectHTMLAttributes } from 'react'
import { Icon } from './Icon'
import './select.css'

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'multiple' | 'size'> & { displayValue?: string }
type Choice = {value: string; label: string; disabled: boolean}

/** The native backing field preserves FormData and existing bubbling change handlers. */
export function Select({children, displayValue, className, onChange, ...props}: Props) {
 const id = useId(), native = useRef<HTMLSelectElement>(null), trigger = useRef<HTMLButtonElement>(null), popup = useRef<HTMLSpanElement>(null)
 const [choices, setChoices] = useState<Choice[]>([]), [selected, setSelected] = useState(''), [open, setOpen] = useState(false), [active, setActive] = useState(0)
 const typeahead = useRef({text: '', time: 0})
 useEffect(() => {
  const field = native.current!
  setChoices(Array.from(field.options, option => ({value: option.value, label: option.text, disabled: option.disabled})))
  setSelected(field.value)
 }, [children, props.value, props.defaultValue])
 function close() { popup.current?.hidePopover(); setOpen(false) }
 function show() {
  if (props.disabled || !choices.length) return
  const bounds = trigger.current!.getBoundingClientRect(), menu = popup.current!
  const viewport = window.visualViewport, height = viewport?.height ?? window.innerHeight, top = viewport?.offsetTop ?? 0
  const viewportWidth = document.documentElement.clientWidth
  const width = Math.min(Math.max(bounds.width, 256), viewportWidth - 24)
  const below = top + height - bounds.bottom - 12, above = bounds.top - top - 12
  const upwards = below < Math.min(352, choices.length * 72 + 16) && above > below
  menu.style.width = `${width}px`
  menu.style.left = `${Math.max(12, Math.min(bounds.left, viewportWidth - width - 12))}px`
  menu.style.maxHeight = `${Math.max(96, Math.min(352, upwards ? above - 8 : below - 8))}px`
  menu.style.top = upwards ? 'auto' : `${bounds.bottom + 8}px`
  menu.style.bottom = upwards ? `${window.innerHeight - bounds.top + 8}px` : 'auto'
  setActive(Math.max(0, choices.findIndex(option => option.value === selected && !option.disabled)))
  menu.showPopover(); setOpen(true)
 }
 function choose(index: number) {
  const option = choices[index]
  if (!option || option.disabled) return
  const field = native.current!
  if (field.value !== option.value) {
   field.value = option.value
   field.dispatchEvent(new Event('change', {bubbles: true}))
  }
  close(); trigger.current?.focus({preventScroll: true})
 }
 function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
  const enabled = choices.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0)
  if (event.key === 'Tab') { close(); return }
  if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); return }
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
   event.preventDefault()
   if (!open) { show(); return }
   const position = enabled.indexOf(active)
   setActive(event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1)! : enabled[Math.max(0, Math.min(enabled.length - 1, position + (event.key === 'ArrowDown' ? 1 : -1)))])
  } else if (event.key === 'Enter' || event.key === ' ') {
   event.preventDefault(); if (open) choose(active); else show()
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
   event.preventDefault()
   const now = Date.now(), text = (now - typeahead.current.time < 700 ? typeahead.current.text : '') + event.key.toLocaleLowerCase()
   typeahead.current = {text, time: now}
   if (!open) show()
   const match = choices.findIndex(option => !option.disabled && option.label.toLocaleLowerCase().startsWith(text))
   if (match >= 0) setActive(match)
  }
 }
 useEffect(() => {
  if (!open) return
  popup.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({block: 'nearest'})
 }, [active, open])
 useEffect(() => {
  if (!open) return
  const dismiss = () => close()
  const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) close() }
  window.addEventListener('resize', dismiss)
  window.addEventListener('scroll', scroll, true)
  return () => {window.removeEventListener('resize', dismiss); window.removeEventListener('scroll', scroll, true)}
 }, [open])
 const title = displayValue ?? choices.find(option => option.value === selected)?.label ?? ''
 return <span className={`ep-select ${className ?? ''}`}>
  <button ref={trigger} type="button" role="combobox" className="ep-select-trigger" aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} aria-required={props.required} aria-invalid={props['aria-invalid']} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-${active}` : undefined} disabled={props.disabled} title={title} onClick={() => open ? close() : show()} onKeyDown={keyboard} onBlur={() => close()}>
   <span className="ep-select-value">{title}</span><Icon name="down" size={18}/>
  </button>
  <select {...props} ref={native} hidden aria-hidden="true" tabIndex={-1} className="ep-select-native" onChange={event => {setSelected(event.target.value); onChange?.(event)}}>{children}</select>
  <span ref={popup} popover="auto" role="listbox" id={`${id}-list`} className="ep-select-menu" aria-label={props['aria-label']} onToggle={event => setOpen(event.newState === 'open')} onMouseDown={event => event.preventDefault()} onClick={event => {event.preventDefault(); event.stopPropagation()}}>
   {choices.map((option, index) => <button key={option.value} id={`${id}-${index}`} data-index={index} type="button" role="option" tabIndex={-1} disabled={option.disabled} aria-selected={option.value === selected} className={`ep-select-option${index === active ? ' is-active' : ''}`} onPointerMove={() => setActive(index)} onClick={() => choose(index)}><span>{option.label}</span><span className="ep-select-check">{option.value === selected && <Icon name="check" size={18}/>}</span></button>)}
  </span>
 </span>
}
