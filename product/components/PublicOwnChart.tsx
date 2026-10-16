import {tr} from '../i18n'
import type {OwnBirthDetails} from '../state/settings-export'
import {ownChartPresentation,type PublicOwnChartState} from '../state/publicOwnChart'
import {Chart} from './Chart'
import {AstronomyCalculationResult} from './AstronomyCalculationResult'
export type PublicOwnChartProps={ownerId:string;birth?:OwnBirthDetails;state?:PublicOwnChartState;ownerPreview?:boolean;onEditBirth?:()=>void}
/** Pure presentation: no storage, network or generated coordinates. Publication owner supplies
 * a permission + input + result snapshot. This is not a calculation engine or public publisher. */
export function PublicOwnChart({ownerId,birth,state,ownerPreview=false,onEditBirth}:PublicOwnChartProps){
 const status=ownChartPresentation(ownerId,birth,state);
 if(status==='hidden')return null;
 const explanation=({
  'birth-required':tr('Для показа карты заполните свои данные рождения в настройках профиля.','Complete your birth details in profile settings to display your chart.'),
  loading:tr('Загружаем карту.','Loading chart.'),
  unavailable:tr('Результат расчёта пока недоступен. Разрешение на показ сохранено.','The calculation result is not available yet. Your display permission is saved.'),
  stale:tr('Данные рождения изменились или результат относится к другому профилю. Нужен соответствующий расчёт.','Birth details changed or this result belongs to another profile. A matching calculation is required.'),
  error:tr('Не удалось отобразить корректную карту. Проверьте результат расчёта.','A valid chart could not be displayed. Check the calculation result.'),
  ready:''
 } as const)[status];
 return <section className="ep-section" aria-label={tr('Карта специалиста','Specialist chart')}>
  {status!=='ready'&&<h2>{tr('Моя натальная карта','My natal chart')}</h2>}
  {status==='ready'&&state?.status==='ready'?(state.result.format==='natal'?<Chart data={state.result.data}/>:<AstronomyCalculationResult result={state.result.data}/>):<p className={status==='error'?'ep-error':'ep-muted'} role={status==='error'?'alert':'status'}>{ownerPreview?explanation:status==='loading'?tr('Загружаем карту.','Loading chart.'):tr('Карта пока недоступна.','The chart is not available yet.')}</p>}
  {ownerPreview&&status!=='ready'&&status!=='loading'&&onEditBirth&&<button className="ep-text-button" onClick={onEditBirth}>{tr('Мои данные рождения','My birth details')}</button>}
 </section>
}
