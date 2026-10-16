import {ownBirthError,type OwnBirthDetails} from './settings-export'
import type {NatalChartData} from './natalChart'
import {validAstronomyResult,type AstrologyResult} from './calculationPresentation'
export type OwnChartBirth=Pick<OwnBirthDetails,'date'|'time'|'place'|'timeUnknown'>
/** Bind a result to the specialist and exact input. Never substitute a client's reference chart.
 * Backend handoff: return this result with the public-profile publication snapshot; retain
 * the permission and birth fingerprint there, rather than reading another account's storage.
 * An explicitly supplied verified reference may use format:natal, with its source documented.
 */
export type PublicOwnChartState = {status:'loading'|'unavailable'|'error'} | {
 status:'ready';ownerId:string;birth:OwnChartBirth;source:string;calculatedAt:string;
 result:{format:'natal';data:NatalChartData}|{format:'astrology';data:AstrologyResult}
}
export function sameOwnChartBirth(a:OwnChartBirth,b:OwnChartBirth){return a.date===b.date&&a.timeUnknown===b.timeUnknown&&(a.timeUnknown||a.time===b.time)&&a.place.trim()===b.place.trim()}
function validNatal(data:NatalChartData){
 const degree=(x:number)=>Number.isFinite(x)&&x>=0&&x<360;
 const keys=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
 return data?.zodiac==='tropical'&&typeof data.houseSystem==='string'&&!!data.houseSystem.trim()&&typeof data.utc==='string'&&Number.isFinite(Date.parse(data.utc))&&Number.isFinite(data.latitude)&&Math.abs(data.latitude)<=90&&Number.isFinite(data.longitude)&&Math.abs(data.longitude)<=180&&degree(data.ascendant)&&degree(data.midheaven)&&Array.isArray(data.cusps)&&data.cusps.length===12&&data.cusps.every(degree)&&new Set(data.cusps).size===12&&Array.isArray(data.planets)&&data.planets.length===10&&new Set(data.planets.map(p=>p.key)).size===10&&data.planets.every(p=>keys.includes(p.key)&&degree(p.longitude)&&Number.isFinite(p.speed));
}
export type OwnChartPresentation='hidden'|'birth-required'|'loading'|'unavailable'|'error'|'stale'|'ready'
export function ownChartPresentation(ownerId:string,birth:OwnBirthDetails|undefined,state?:PublicOwnChartState):OwnChartPresentation{
 if(!birth?.showOwnChart)return 'hidden';
 if(ownBirthError(birth))return 'birth-required';
 if(!state)return 'unavailable';
 if(state.status!=='ready')return state.status;
 try{
  if(!ownerId||state.ownerId!==ownerId||!sameOwnChartBirth(state.birth,birth))return 'stale';
  if(typeof state.source!=='string'||!state.source.trim()||!Number.isFinite(Date.parse(state.calculatedAt)))return 'error';
  if(state.result.format==='natal')return !birth.timeUnknown&&validNatal(state.result.data)?'ready':'error';
  const data=state.result.data;
  if(!validAstronomyResult(data)||data.kind!=='astrology'||data.layers.length!==1)return 'error';
  const layer=data.layers[0];
  // An unknown birth time cannot establish houses or angles. Reject, never silently show them.
  if(birth.timeUnknown&&(layer.cusps||layer.ascendant!==undefined||layer.midheaven!==undefined||layer.positions.some(p=>p.house!==undefined)))return 'error';
  if(!birth.timeUnknown&&(!layer.cusps||layer.ascendant===undefined||layer.midheaven===undefined))return 'error';
  return layer.positions.length?'ready':'error';
 }catch{return 'error'}
}

export type OwnChartSnapshot={ownerId:string;birth:OwnBirthDetails;state?:PublicOwnChartState}
/** Freeze only the permitted specialist data. Reject a stale/foreign response before storage. */
export function createOwnChartSnapshot(ownerId:string,birth?:OwnBirthDetails,state?:PublicOwnChartState):OwnChartSnapshot|null{
 if(!birth?.showOwnChart)return null;
 const status=ownChartPresentation(ownerId,birth,state);
 return structuredClone({ownerId,birth,state:status==='ready'?state:{status:status==='error'?'error' as const:'unavailable' as const}});
}
/** Revocation takes immediate effect, while enabling later cannot alter an older snapshot. */
export function permittedOwnChartSnapshot(snapshot:OwnChartSnapshot|null|undefined,currentBirth?:OwnBirthDetails){return snapshot&&currentBirth?.showOwnChart? snapshot:undefined}
export function ownChartSnapshotChanged(prepared:OwnChartSnapshot|null|undefined,current:OwnChartSnapshot|null){return JSON.stringify(prepared??null)!==JSON.stringify(current)}
