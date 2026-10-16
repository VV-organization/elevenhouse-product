export type Material = {id:string;title:string;category:string;text:string;updated:string}
export function initialMaterials(example: boolean): Material[] {
  return example ? [
    { id: 'm1', title: 'Перед первой встречей', category: 'Подготовка к встрече', text: '1. Уточнить, с каким вопросом приходит клиент.\n2. Проверить дату, место и известность времени рождения.\n3. Согласовать длительность и формат встречи.\n4. В конце выделить одно следующее действие.', updated: '2026-10-14T12:00:00.000Z' },
    { id: 'm2', title: 'Как подвести итоги месяца', category: 'Практики', text: 'Предложите клиенту вспомнить три значимых события месяца. Что получилось? Что оказалось сложнее ожидаемого?\n\nСформулируйте одну достижимую цель до следующей встречи и договоритесь, как заметить результат.', updated: '2026-10-12T12:00:00.000Z' },
    { id: 'm3', title: 'Вопросы о профессиональном выборе', category: 'Трактовки', text: 'Вопросы для подготовки к консультации.\n\nЧто клиент хочет изменить в работе? Какие ограничения он видит? Какие варианты уже рассматривает?\n\nСвязывайте наблюдения с реальным запросом и проверяйте каждое утверждение перед обсуждением.', updated: '2026-10-10T12:00:00.000Z' },
  ] : []
}

/** A later save updates this result's material without duplicating it or changing other entries. */
export function saveCalculationMaterial(materials:Material[],id:string,title:string,text:string,updated:string):Material[]{
  if(!text.trim())return materials
  return [...materials.filter(item=>item.id!==id),{id,title,category:'Трактовки',text:text.trim(),updated}]
}
