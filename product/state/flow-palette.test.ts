import {describe,it,expect} from 'vitest'
import {flowPalette,newPaletteStep,flowTriggerChoices,flowCalculationDefaults,flowConfigurationError} from './flow-palette'
import {validateFlow,traceFlow,type Flow} from './communication-workflows'
describe('original workflow palette',()=>{
 it('preserves every original trigger and action entry',()=>{
  const keys=flowPalette.map(x=>x.id)
  for(const key of ['lead','purchase','msg_in','transit','segment','form_done','booking','review','sub_renew','chart_ready','journal_entry'])expect(flowTriggerChoices.some(x=>x[0]===key)).toBe(true)
  for(const key of ['send','form','chart','slot','pay','deliver','access','cert','tag','task','webhook','acg','numerology','matrix','humandesign','publish','sub_post','broadcast','ai_classify','ai_summary','ai_score','ai_extract','ai_reply','ai_content','if','chart_cond','split','ab','delay','handoff','session'])expect(keys).toContain(key)
 })
 it('retains structured calculation outputs and destinations for every method',()=>{
  const step=newPaletteStep('acg','calc');expect(step.calculation).toMatchObject({type:'acg',outputs:['planets','aspects','houses','wheel'],dest:['client','ai']});expect(flowConfigurationError(step)).toBe('configuration');
  step.calculation!.cities='Из анкеты клиента';expect(flowConfigurationError(step)).toBe('');
  expect(flowCalculationDefaults('vedic').houses).toBe('placidus')
 })
 it('checks configured value branches without inventing chart facts',()=>{
  const condition=newPaletteStep('chart_cond','cond');condition.params={rule:'Солнце в огненном знаке'};condition.branches={yes:null,no:null};const flow:Flow={id:'f',name:'Проверка',text:'',kind:'custom',status:'paused',trigger:'manual',steps:[condition]};
  expect(validateFlow(flow)).toBe('');expect(traceFlow(flow,{name:'А',birthComplete:true,hasAppointment:false,completed:false,paid:false,subscribed:false})[0].status).toBe('blocked');
  expect(traceFlow(flow,{name:'А',birthComplete:true,hasAppointment:false,completed:false,paid:false,subscribed:false,conditionResults:{cond:true}})[0].conditionResult).toBe(true)
 })
 it('does not allow a publishing action to bypass human review',()=>{
  const publish=newPaletteStep('publish','p');publish.params={destination:'Канал',text:'Текст',format:'post'};const f:Flow={id:'f',name:'Пост',text:'',kind:'custom',status:'paused',trigger:'manual',steps:[publish]};expect(validateFlow(f)).toBe('approval');expect(validateFlow({...f,steps:[{id:'a',kind:'approval',value:''},publish]})).toBe('')
 })
})
