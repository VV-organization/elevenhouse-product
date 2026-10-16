import {validDate} from '../state/commerce-model'
import {tr} from '../i18n'
export type FamilyProfile={id:string;name:string;relation:string;birthDate:string;birthTime:string;birthPlace:string;unknownTime:boolean}
export function familyError(p:FamilyProfile,today=new Date().toISOString().slice(0,10)){
 if(!p.name.trim()||!p.relation.trim())return tr('Укажите имя и кем вам приходится этот человек.','Enter a name and relationship.')
 if(!validDate(p.birthDate)||p.birthDate>today)return tr('Проверьте дату рождения.','Check the birth date.')
 if(!p.unknownTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.birthTime))return tr('Укажите время рождения или отметьте, что оно неизвестно.','Enter the birth time or mark it as unknown.')
 if(!p.birthPlace.trim())return tr('Укажите город рождения.','Enter the birth city.')
 return ''
}
export function familyAnswers(profile:FamilyProfile,partner=false){const p=partner?'partner':'birth';return {[p+'Name']:profile.name,[p+'Date']:profile.birthDate,[p+'Time']:profile.unknownTime?'':profile.birthTime,[p+'Place']:profile.birthPlace,[p+'Unknown']:profile.unknownTime?'yes':''}}
