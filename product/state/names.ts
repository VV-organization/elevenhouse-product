import {tr} from '../i18n'
/** Stored display names remain compatible with existing client records. */
export function givenName(name:string){return name.trim().split(/\s+/)[0]||''}
export function splitClientName(name:string){const [firstName='',...rest]=name.trim().split(/\s+/);return {firstName,lastName:rest.join(' ')}}
export function clientFullName(firstName:string,lastName:string){
 const first=firstName.trim().replace(/\s+/g,' '),last=lastName.trim().replace(/\s+/g,' ')
 if(!first)throw new Error(tr('Укажите имя клиента.',"Enter the client's name."))
 if(!last)throw new Error(tr('Укажите фамилию, чтобы различать клиентов с одинаковыми именами.', 'Enter a last name to distinguish clients with the same first name.'))
 return `${first} ${last}`
}
