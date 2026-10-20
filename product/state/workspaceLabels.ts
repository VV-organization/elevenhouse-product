/** Hide internal fixture annotations without changing stored provenance or user-authored text. */
export function isInternalPreviewLabel(value:string){
 return /^(демонстрационн|demonstration|пример расчёта ·|example calculation ·)/i.test(value.trim())
}
const legacyLabels:Record<string,string>={
 'Растущая Луна · пример':'Растущая Луна',
 'Waxing Moon · example':'Waxing Moon',
 'Рабочие заметки специалиста · пример':'Рабочие заметки специалиста',
 'Пример завершённой выплаты в истории аккаунта':'Выплата завершена',
 'Демонстрационное событие. Можно открыть карту, подготовить сообщение, публикацию или сценарий. Дата условная.':'',
 'Demonstration event. Open its chart or prepare a message, post or workflow. The date is illustrative.':'',
}
export function workspaceLabel(value:string){return legacyLabels[value]??value}
