import {TODAY} from './model'
export function calendarDate(value:string){const parsed=new Date(`${value}T12:00:00Z`);return Number.isNaN(parsed.valueOf())?new Date(`${TODAY}T12:00:00Z`):parsed}
export function dateKey(date:Date){return date.toISOString().slice(0,10)}
export function shiftDay(value:string,amount:number){const date=calendarDate(value);date.setUTCDate(date.getUTCDate()+amount);return dateKey(date)}
export function shiftMonth(value:string,amount:number){const date=calendarDate(value),day=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+amount);const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,last));return dateKey(date)}
export function monthDays(value:string){const date=calendarDate(value);date.setUTCDate(1);const offset=(date.getUTCDay()+6)%7;const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();const count=Math.ceil((offset+last)/7)*7;return Array.from({length:count},(_,i)=>shiftDay(dateKey(date),i-offset))}
