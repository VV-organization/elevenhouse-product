import type {ProductData} from './product-data'
/** A selected specialist must supply their own practice, never inherit another one's records. */
export function resolvePortalContext(portal:NonNullable<ProductData['portal']>,accountScope:string){
 if(!portal.practice||!portal.clientId||!portal.practice.clients.some(client=>client.id===portal.clientId))return null
 const identity=[portal.activeAstrologerId||'current',portal.clientId].map(encodeURIComponent).join(':')
 return {practice:portal.practice,clientId:portal.clientId,scope:`${accountScope}:${portal.moduleScope||'portal'}:${identity}`}
}
