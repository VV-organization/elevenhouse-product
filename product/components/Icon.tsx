import type { ReactNode } from 'react'

const paths: Record<string, ReactNode> = {
  message:<><path d="M4 4h16v12H9l-5 4z"/><path d="M8 8h8m-8 4h5"/></>,
  wallet:<><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h18m-6 5h6m-5 3h.1"/></>,
  analytics:<><path d="M4 20h16M6 16v-5m6 5V5m6 11V8"/></>,
  flow:<><rect x="8" y="2" width="8" height="5" rx="1"/><path d="M12 7v5M5 12h14M5 12v4m14-4v4"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/></>,
  star:<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>,
  service:<><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8 6V3h8v3m-8 6h8m-8 4h5"/></>,
  practice:<><path d="M3 9 12 3l9 6v12H3z"/><path d="M9 21v-8h6v8"/></>,
  settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></>,
  today: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7m-3.5-3.5v7"/></>,
  clients: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2m2-17a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5v2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/></>,
  chart: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m6 5 13 12M4 13l15-6m-9 14 5-18"/></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  back: <path d="m14 5-7 7 7 7"/>,
  down: <path d="m6 9 6 6 6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  note: <><path d="M15 3H5v18h14V7z"/><path d="M14 3v5h5M8 12h8m-8 4h6"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5.7-1.5 1-1.5 3m0 3v.1"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  video: <><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-4v12l-6-4"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  logout: <><path d="M9 3H4v18h5m5-9H8m6-6 6 6-6 6m6-6h-8"/></>,
}
export function Icon({name,size=20}:{name:string,size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]??paths.note}</svg>
}
