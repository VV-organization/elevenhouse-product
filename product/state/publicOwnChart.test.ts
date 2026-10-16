import {describe,it,expect} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createElement} from 'react'
import {PublicOwnChart} from '../components/PublicOwnChart'
import {ownChartPresentation,type PublicOwnChartState} from './publicOwnChart'
import {marinaNatalReference} from './natalReference'
const birth={date:'1990-03-14',time:'08:25',timeUnknown:false,place:'Москва',showOwnChart:true};
// Deliberately bound test reference. The component itself imports no reference fixture.
const state:PublicOwnChartState={status:'ready',ownerId:'test-owner',birth,source:'Swiss Ephemeris test reference',calculatedAt:'2026-10-16T10:00:00Z',result:{format:'natal',data:marinaNatalReference}}
describe('public specialist chart',()=>{
 it('never displays birth data or chart without explicit permission',()=>{expect(ownChartPresentation('test-owner',{...birth,showOwnChart:false},state)).toBe('hidden');expect(renderToStaticMarkup(createElement(PublicOwnChart,{ownerId:'test-owner',birth:{...birth,showOwnChart:false},state}))).toBe('')})
 it('does not substitute an example when no result is supplied',()=>{expect(ownChartPresentation('test-owner',birth)).toBe('unavailable');const html=renderToStaticMarkup(createElement(PublicOwnChart,{ownerId:'test-owner',birth,ownerPreview:true}));expect(html).toContain('Результат расчёта пока недоступен');expect(html).not.toContain('<svg')})
 it('rejects results of another owner and any changed birth input',()=>{expect(ownChartPresentation('another-owner',birth,state)).toBe('stale');expect(ownChartPresentation('test-owner',{...birth,time:'08:26'},state)).toBe('stale');expect(ownChartPresentation('test-owner',{...birth,place:'Казань'},state)).toBe('stale')})
 it('preserves houses, axes and aspects in an explicitly supplied complete natal result',()=>{expect(ownChartPresentation('test-owner',birth,state)).toBe('ready');const html=renderToStaticMarkup(createElement(PublicOwnChart,{ownerId:'test-owner',birth,state}));for(const label of ['ASC','DSC','MC','IC','Дома','Аспекты'])expect(html).toContain(label);expect(html).toContain('ep-natal-cusp');expect(html).toContain('ep-natal-aspect')})
 it('does not show claimed angles and houses when the time is unknown',()=>{expect(ownChartPresentation('test-owner',{...birth,timeUnknown:true}, {...state,birth:{...birth,timeUnknown:true}})).toBe('error')})
 it('rejects malformed numerical data instead of drawing plausible geometry',()=>{expect(ownChartPresentation('test-owner',birth,{...state,result:{format:'natal',data:{...marinaNatalReference,ascendant:NaN}}})).toBe('error');expect(ownChartPresentation('test-owner',birth,{...state,result:{format:'natal',data:{...marinaNatalReference,cusps:[]}}})).toBe('error')})
})

import {createOwnChartSnapshot,permittedOwnChartSnapshot,ownChartSnapshotChanged} from './publicOwnChart'
import {newPublicProfile,preparePublicProfile} from './public-profile'
describe('public chart publication snapshot',()=>{
 it('freezes birth data and calculation instead of following subsequent settings edits',()=>{const mutable=structuredClone(state),input={...birth};const snapshot=createOwnChartSnapshot('test-owner',input,mutable);const prepared=preparePublicProfile(newPublicProfile('Анна'),'2026-10-16T12:00:00Z',[],snapshot);input.time='09:00';mutable.source='Changed source';if(mutable.result.format==='natal')mutable.result.data={...mutable.result.data,ascendant:90};expect(prepared.preparedOwnChart?.birth.time).toBe('08:25');expect(prepared.preparedOwnChart?.state?.status==='ready'&&prepared.preparedOwnChart.state.source).toBe('Swiss Ephemeris test reference');expect(ownChartSnapshotChanged(prepared.preparedOwnChart,createOwnChartSnapshot('test-owner',input,mutable))).toBe(true)})
 it('hides a prepared chart on permission revocation without mutating the prepared data',()=>{const snapshot=createOwnChartSnapshot('test-owner',birth,state)!;expect(permittedOwnChartSnapshot(snapshot,{...birth,showOwnChart:false})).toBeUndefined();expect(snapshot.birth.showOwnChart).toBe(true);expect(permittedOwnChartSnapshot(null,birth)).toBeUndefined();expect(permittedOwnChartSnapshot(snapshot,birth)).toBe(snapshot)})
 it('does not persist another person’s calculation when preparing a page',()=>{const snapshot=createOwnChartSnapshot('another-owner',birth,state);expect(snapshot?.state).toEqual({status:'unavailable'});expect(JSON.stringify(snapshot)).not.toContain('ascendant');expect(createOwnChartSnapshot('test-owner',{...birth,showOwnChart:false},state)).toBeNull()})
 it('only marks a permission/result change as dirty; absent legacy snapshot equals disabled',()=>{expect(ownChartSnapshotChanged(undefined,null)).toBe(false);const snapshot=createOwnChartSnapshot('test-owner',birth,state);expect(ownChartSnapshotChanged(snapshot,createOwnChartSnapshot('test-owner',birth,state))).toBe(false);expect(ownChartSnapshotChanged(snapshot,null)).toBe(true)})
})
