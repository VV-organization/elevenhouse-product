import {useState} from 'react'

export type InterfaceTheme = 'dark' | 'light'
// Temporarily disabled; retain the light palette and saved preferences for its return.
export const THEME_SWITCHING_ENABLED = false

export function useInterfaceTheme(storageKey:string, fallback:InterfaceTheme='dark'){
 const [preference,setPreference]=useState<InterfaceTheme>(()=>{
  try{const saved=localStorage.getItem(storageKey);if(saved==='light'||saved==='dark')return saved}catch{}
  return fallback
 })
 function changeTheme(value:InterfaceTheme){
  if(!THEME_SWITCHING_ENABLED)return
  setPreference(value)
  try{localStorage.setItem(storageKey,value)}catch{}
 }
 const theme:InterfaceTheme=THEME_SWITCHING_ENABLED?preference:'dark'
 return [theme,changeTheme] as const
}
