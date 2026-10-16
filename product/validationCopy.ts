import {tr} from './i18n'

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
const localized = new WeakSet<Control>()
const isControl = (target: EventTarget | null): target is Control => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
export function constraintMessage(validity: ValidityState, type: string, min: string, max: string): string {
 if(validity.valid)return ''
 if(validity.valueMissing)return tr('Заполните это поле.','Please fill in this field.')
 if(validity.typeMismatch)return type==='email'?tr('Введите корректный адрес электронной почты.','Enter a valid email address.'):tr('Введите корректный адрес ссылки.','Enter a valid URL.')
 if(validity.rangeUnderflow)return tr(`Укажите значение не меньше ${min}.`,`Enter a value of at least ${min}.`)
 if(validity.rangeOverflow)return tr(`Укажите значение не больше ${max}.`,`Enter a value no greater than ${max}.`)
 if(validity.tooShort)return tr('Введённый текст слишком короткий.','The text is too short.')
 if(validity.tooLong)return tr('Введённый текст слишком длинный.','The text is too long.')
 if(validity.badInput)return tr('Проверьте введённое значение.','Check the value you entered.')
 if(validity.stepMismatch)return tr('Укажите значение с допустимым шагом.','Enter a value using the allowed increment.')
 return tr('Проверьте формат введённых данных.','Check the format of this value.')
}
/** Keep native constraints, focus and accessible validation, with product-language copy. */
export function localizeInvalidControl(event: {target: EventTarget | null}) {
 if(!isControl(event.target))return
 const input=event.target
 if(localized.has(input))input.setCustomValidity('')
 else if(input.validity.customError)return
 input.setCustomValidity(constraintMessage(input.validity,input.getAttribute('type')||'',input.getAttribute('min')||'',input.getAttribute('max')||''))
 localized.add(input)
}
export function clearLocalizedValidity(event: {target: EventTarget | null}) {
 if(isControl(event.target)&&localized.has(event.target)){event.target.setCustomValidity('');localized.delete(event.target)}
}
