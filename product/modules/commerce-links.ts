/** A stable route to a service; account data still comes from the authenticated scope. */
export function serviceLink(base:string,id:string){const url=new URL(base);url.search='';url.searchParams.set('surface','client');url.searchParams.set('service',id);url.hash='';return url.toString()}
export function serviceIdFromLink(value:string){return new URL(value).searchParams.get('service')||undefined}
