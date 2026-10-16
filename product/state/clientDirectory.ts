import type {Practice} from './model'
import type {Payment} from '../modules/ServicesFinance'
import {tr} from '../i18n'
export function moveClientStage(p:Practice,id:string,stage:string):Practice{
 if(!p.clients.some(c=>c.id===id))throw new Error(tr('Клиент не найден.','Client not found.'))
 if(stage&&!['new','active','paused','archived',...(p.clientStages||[]).map(s=>s.id)].includes(stage))throw new Error(tr('Этап не найден.','Stage not found.'))
 return {...p,clients:p.clients.map(c=>c.id===id?{...c,stage:stage||undefined,updatedAt:new Date().toISOString()}:c)}
}
export function clientTotals(id:string,payments:Payment[]){return payments.filter(p=>p.clientId===id&&p.status==='paid').reduce((sum,p)=>sum+p.amount,0)}
export function addClientStage(p:Practice,name:string):Practice{
 const label=name.trim();if(!label||label.length>40)throw new Error(tr('Название этапа: от 1 до 40 символов.','Stage name must contain 1–40 characters.'))
 if(p.clientStages?.some(s=>s.label.toLocaleLowerCase()===label.toLocaleLowerCase()))throw new Error(tr('Такой этап уже есть.','This stage already exists.'))
 return {...p,clientStages:[...(p.clientStages||[]),{id:`custom-${Date.now()}`,label}]}
}
