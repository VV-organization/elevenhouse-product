// Selected Iconity assets supplied by the project owner. Profile and clock are matching custom drawings with local SVG motion.
import profileStatic from '../assets/icons/iconity/profile.svg?url'
import todayStatic from '../assets/icons/iconity/today.svg?url'
import todayAnimation from '../assets/icons/iconity/today.json?url'
import clientsStatic from '../assets/icons/iconity/clients.svg?url'
import clientsAnimation from '../assets/icons/iconity/clients.json?url'
import calendarStatic from '../assets/icons/iconity/calendar.svg?url'
import calendarAnimation from '../assets/icons/iconity/calendar.json?url'
import chartStatic from '../assets/icons/iconity/chart.svg?url'
import chartAnimation from '../assets/icons/iconity/chart.json?url'
import messageStatic from '../assets/icons/iconity/message.svg?url'
import messageAnimation from '../assets/icons/iconity/message.json?url'
import walletStatic from '../assets/icons/iconity/wallet.svg?url'
import walletAnimation from '../assets/icons/iconity/wallet.json?url'
import analyticsStatic from '../assets/icons/iconity/analytics.svg?url'
import analyticsAnimation from '../assets/icons/iconity/analytics.json?url'
import flowStatic from '../assets/icons/iconity/flow.svg?url'
import flowAnimation from '../assets/icons/iconity/flow.json?url'
import starStatic from '../assets/icons/iconity/star.svg?url'
import starAnimation from '../assets/icons/iconity/star.json?url'
import serviceStatic from '../assets/icons/iconity/service.svg?url'
import serviceAnimation from '../assets/icons/iconity/service.json?url'
import practiceStatic from '../assets/icons/iconity/practice.svg?url'
import practiceAnimation from '../assets/icons/iconity/practice.json?url'
import settingsStatic from '../assets/icons/iconity/settings.svg?url'
import settingsAnimation from '../assets/icons/iconity/settings.json?url'
import arrowAnimation from '../assets/icons/iconity/arrow.json?url'
import arrowStatic from '../assets/icons/iconity/arrow.svg?url'
import backAnimation from '../assets/icons/iconity/back.json?url'
import backStatic from '../assets/icons/iconity/back.svg?url'
import downAnimation from '../assets/icons/iconity/down.json?url'
import downStatic from '../assets/icons/iconity/down.svg?url'
import plusAnimation from '../assets/icons/iconity/plus.json?url'
import plusStatic from '../assets/icons/iconity/plus.svg?url'
import closeAnimation from '../assets/icons/iconity/close.json?url'
import closeStatic from '../assets/icons/iconity/close.svg?url'
import searchAnimation from '../assets/icons/iconity/search.json?url'
import searchStatic from '../assets/icons/iconity/search.svg?url'
import noteStatic from '../assets/icons/iconity/note.svg?url'
import noteAnimation from '../assets/icons/iconity/note.json?url'
import libraryStatic from '../assets/icons/iconity/library.svg?url'
import libraryAnimation from '../assets/icons/iconity/library.json?url'
import publicationStatic from '../assets/icons/iconity/publication.svg?url'
import publicationAnimation from '../assets/icons/iconity/publication.json?url'
import reminderStatic from '../assets/icons/iconity/reminder.svg?url'
import reminderAnimation from '../assets/icons/iconity/reminder.json?url'
import checkAnimation from '../assets/icons/iconity/check.json?url'
import checkStatic from '../assets/icons/iconity/check.svg?url'
import helpStatic from '../assets/icons/iconity/help.svg?url'
import helpAnimation from '../assets/icons/iconity/help.json?url'
import menuStatic from '../assets/icons/iconity/menu.svg?url'
import menuAnimation from '../assets/icons/iconity/menu.json?url'
import videoStatic from '../assets/icons/iconity/video.svg?url'
import videoAnimation from '../assets/icons/iconity/video.json?url'
import pinAnimation from '../assets/icons/iconity/pin.json?url'
import pinStatic from '../assets/icons/iconity/pin.svg?url'
import logoutStatic from '../assets/icons/iconity/logout.svg?url'
import logoutAnimation from '../assets/icons/iconity/logout.json?url'
import mailAnimation from '../assets/icons/iconity/mail.json?url'
import mailStatic from '../assets/icons/iconity/mail.svg?url'
import phoneAnimation from '../assets/icons/iconity/phone.json?url'
import phoneStatic from '../assets/icons/iconity/phone.svg?url'
import infoAnimation from '../assets/icons/iconity/info.json?url'
import infoStatic from '../assets/icons/iconity/info.svg?url'
import lockAnimation from '../assets/icons/iconity/lock.json?url'
import lockStatic from '../assets/icons/iconity/lock.svg?url'
import clockStatic from '../assets/icons/iconity/clock.svg?url'
import attachmentStatic from '../assets/icons/iconity/attachment.svg?url'
import attachmentAnimation from '../assets/icons/iconity/attachment.json?url'
export const iconAssets: Record<string,{static:string,animation?:string,motion?:'profile'|'clock'}> = {
 attachment: {static:attachmentStatic,animation:attachmentAnimation},
 profile: {static:profileStatic,motion:'profile'},
 today: {static:todayStatic,animation:todayAnimation},
 clients: {static:clientsStatic,animation:clientsAnimation},
 calendar: {static:calendarStatic,animation:calendarAnimation},
 chart: {static:chartStatic,animation:chartAnimation},
 message: {static:messageStatic,animation:messageAnimation},
 wallet: {static:walletStatic,animation:walletAnimation},
 analytics: {static:analyticsStatic,animation:analyticsAnimation},
 flow: {static:flowStatic,animation:flowAnimation},
 star: {static:starStatic,animation:starAnimation},
 service: {static:serviceStatic,animation:serviceAnimation},
 practice: {static:practiceStatic,animation:practiceAnimation},
 settings: {static:settingsStatic,animation:settingsAnimation},
 arrow: {static:arrowStatic,animation:arrowAnimation},
 back: {static:backStatic,animation:backAnimation},
 down: {static:downStatic,animation:downAnimation},
 plus: {static:plusStatic,animation:plusAnimation},
 close: {static:closeStatic,animation:closeAnimation},
 search: {static:searchStatic,animation:searchAnimation},
 note: {static:noteStatic,animation:noteAnimation},
 library: {static:libraryStatic,animation:libraryAnimation},
 publication: {static:publicationStatic,animation:publicationAnimation},
 reminder: {static:reminderStatic,animation:reminderAnimation},
 check: {static:checkStatic,animation:checkAnimation},
 help: {static:helpStatic,animation:helpAnimation},
 menu: {static:menuStatic,animation:menuAnimation},
 video: {static:videoStatic,animation:videoAnimation},
 pin: {static:pinStatic,animation:pinAnimation},
 logout: {static:logoutStatic,animation:logoutAnimation},
 mail: {static:mailStatic,animation:mailAnimation},
 phone: {static:phoneStatic,animation:phoneAnimation},
 info: {static:infoStatic,animation:infoAnimation},
 lock: {static:lockStatic,animation:lockAnimation},
 clock: {static:clockStatic,motion:'clock'},
}
