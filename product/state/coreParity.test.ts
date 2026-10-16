import {describe,it,expect} from 'vitest'
import {createExamplePractice,updateClientDetails,parsePractice,saveMeetingUrl,markNoShow,appointmentStatusLabel,addAppointment,rescheduleAppointment,setAppointmentStatus,restoreAppointmentAt} from './model'
import {DEFAULT_BOOKING_RULES} from './bookingRules'
describe('restored client and consultation workflows',()=>{
 it('preserves contacts, stages, tags and birth data across save and reload',()=>{
 const original=createExamplePractice();const changed=updateClientDetails(original,'marina',{name:'Марина Иванова',request:'Новая тема',email:'marina@example.com',phone:'+7 999 000 00 00',telegram:'@marina',stage:'active',tags:['Карьера']});
 expect(parsePractice(JSON.stringify(changed))?.clients[0]).toMatchObject({email:'marina@example.com',stage:'active',tags:['Карьера'],birthDate:'1990-03-14'});expect(original.clients[0].email).toBeUndefined()
 });
 it('does not lose the account when availability conflicts with previously booked appointments',()=>{
 const p={...createExamplePractice(),bookingRules:{...DEFAULT_BOOKING_RULES,enabled:true,start:'15:00'}};
 expect(parsePractice(JSON.stringify(p))).not.toBeNull();
 expect(()=>addAppointment(p,{clientId:'marina',date:'2026-10-16',time:'10:00',duration:60,title:'Consultation'})).toThrow(/рабоч|working/)
 });
 it('enforces buffers while excluding the appointment being rescheduled',()=>{
 const p={...createExamplePractice(),bookingRules:{...DEFAULT_BOOKING_RULES,enabled:true}};
 expect(()=>addAppointment(p,{clientId:'marina',date:'2026-10-15',time:'12:00',duration:60,title:'Consultation'})).toThrow(/перерыв|buffer/);
 expect(()=>rescheduleAppointment(p,'session-marina',{date:'2026-10-15',time:'11:00',duration:60,title:'Consultation'})).not.toThrow()
 });
 it('records no-show separately without altering payment price or deleting the appointment',()=>{
 const p=createExamplePractice();p.appointments[0].price=4900;const changed=markNoShow(p,'session-marina');expect(changed.appointments[0]).toMatchObject({attendance:'no-show',status:'cancelled',price:4900});expect(appointmentStatusLabel(changed.appointments[0])).toMatch(/Неявка|No-show/);expect(parsePractice(JSON.stringify(changed))).toEqual(changed)
 });
 it('clears no-show when a record is restored and enforces working hours on restore',()=>{
 const missed=markNoShow(createExamplePractice(),'session-marina');
 const restored=setAppointmentStatus(missed,'session-marina','confirmed');
 expect(setAppointmentStatus(restored,'session-marina','cancelled').appointments[0].attendance).toBeUndefined();
 expect(restoreAppointmentAt(missed,'session-marina',{date:'2026-10-16',time:'12:00',duration:60,title:'Follow up'}).appointments[0].attendance).toBeUndefined();
 const restricted={...missed,bookingRules:{...DEFAULT_BOOKING_RULES,enabled:true,start:'15:00'}};
 expect(()=>setAppointmentStatus(restricted,'session-marina','confirmed')).toThrow(/рабоч|working/);
 });
 it('saves only safe meeting links and retains them when rescheduling',()=>{
 const p=createExamplePractice();expect(()=>saveMeetingUrl(p,'session-marina','javascript:alert(1)')).toThrow();const changed=saveMeetingUrl(p,'session-marina','https://meet.example.com/marina');expect(rescheduleAppointment(changed,'session-marina',{date:'2026-10-16',time:'12:00',duration:60,title:'Follow up'}).appointments[0].meetingUrl).toBe('https://meet.example.com/marina')
 });
})
