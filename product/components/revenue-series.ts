export type RevenuePoint={date:string;amount:number}
export type RevenueBucket={from:string;to:string;amount:number}
/** Calendar buckets contain recorded payments only; no interpolation or forecast. */
export function revenueSeries(points:RevenuePoint[],from:string,to:string):RevenueBucket[]{
 const start=Date.parse(from+'T00:00:00Z'),end=Date.parse(to+'T00:00:00Z'),day=86400000
 if(!Number.isFinite(start)||!Number.isFinite(end)||start>end)return []
 const days=Math.floor((end-start)/day)+1,step=Math.max(1,Math.ceil(days/31))
 const iso=(n:number)=>new Date(n).toISOString().slice(0,10)
 const buckets=Array.from({length:Math.ceil(days/step)},(_,i)=>({from:iso(start+i*step*day),to:iso(Math.min(end,start+((i+1)*step-1)*day)),amount:0}))
 for(const point of points){if(point.date<from||point.date>to||!Number.isFinite(point.amount))continue;const time=Date.parse(point.date+'T00:00:00Z');if(!Number.isFinite(time))continue;const index=Math.floor((time-start)/day/step);if(buckets[index])buckets[index].amount+=point.amount}
 return buckets
}
