import type {PortalBillingData} from '../modules/portal-billing-model'
import type {TodayData} from './today-workbench'
import type {Practice} from './model'
import type {PortalContentData} from '../modules/portal-content-model'
import type {AdminServerData} from './admin-workflows'
import type {CommunicationServerData} from '../modules/Communication'
import type {SettingsServerData} from './settings-capabilities'
import type {PublicOwnChartState} from './publicOwnChart'
import type {ToolCalculationAdapters} from '../modules/Tools'
import type {PortalAstrologer} from '../modules/portal-astrologers'

/** Supplied account data and adapters. Missing values remain unavailable, never simulated. */
export type ProductData={
 today?:TodayData
 settings?:SettingsServerData
 admin?:AdminServerData
 communication?:CommunicationServerData
 publicOwnChart?:PublicOwnChartState
 calculations?:ToolCalculationAdapters
 portal?:{billingData?:PortalBillingData;contentData?:PortalContentData;
  practice?:Practice
  moduleScope?:string
  onChangePractice?:(practice:Practice)=>void
  clientId?:string
  astrologers?:PortalAstrologer[]
  activeAstrologerId?:string
  onSelectAstrologer?:(id:string)=>void
 }
}
