import type {Client} from './model'
const normalize=(value:string)=>value.toLocaleLowerCase('ru-RU').replaceAll('ё','е').trim()
export function matchesClientQuery(text:string,query:string){
 return normalize(query).split(/\s+/).filter(Boolean).every(word=>normalize(text).includes(word))
}
export function filterClients(clients:readonly Client[],query:string){
 return clients.filter(client=>matchesClientQuery(client.name,query)).sort((a,b)=>a.name.localeCompare(b.name,'ru'))
}
