import {tr} from '../i18n'
export function timeZoneLabel(zone: string): string {
 const names: Record<string, [string,string]> = {
  'Europe/Moscow':['Москва','Moscow'], 'Asia/Yekaterinburg':['Екатеринбург','Yekaterinburg'],
  'Asia/Novosibirsk':['Новосибирск','Novosibirsk'], 'Europe/Kaliningrad':['Калининград','Kaliningrad'], 'Europe/Berlin':['Берлин','Berlin'],
 }
 if (zone === 'UTC') return tr('Всемирное время · UTC','Universal time · UTC')
 const name = names[zone]
 return name ? tr(...name) : zone
}
