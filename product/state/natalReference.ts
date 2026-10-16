import type {NatalChartData} from './natalChart'
/** Verified reference for the existing fictional Marina profile, not a calculator.
 * Source: Astrodienst's public Swiss Ephemeris test utility, retrieved 2026-10-16.
 * https://www.astro.com/cgi/swetest.cgi?b=14.3.1990&n=1&s=1&p=0123456789&e=&f=Pls&arg=-ut05%3A25+-house37.6173%2C55.7558%2CP+-speed
 * swetest 2.10.03: -b14.3.1990 -ut05:25 -p0123456789 -fPls -house37.6173,55.7558,P -speed
 * Local 08:25 Europe/Moscow = 05:25 UTC (IANA historical zone offset +03:00).
 * Coordinate assumption: Moscow city centre, 55.7558 N, 37.6173 E.
 * Tropical, geocentric, Placidus. House numbers use ecliptic cusp intervals.
 * Original design's invented planet positions and house cusps must not be reused.
 * No external requests at runtime. Never reuse for other birth input.
 */
export const marinaNatalReference:NatalChartData={
 utc:'1990-03-14T05:25:00Z',latitude:55.7558,longitude:37.6173,houseSystem:'Placidus',zodiac:'tropical',
 ascendant:51.7589058,midheaven:288.8799996,
 cusps:[51.7589058,77.0018625,93.3047883,108.8799996,128.4157592,162.0963562,231.7589058,257.0018625,273.3047883,288.8799996,308.4157592,342.0963562],
 planets:[
 {key:'sun',longitude:353.3700814,speed:.9966877},
 {key:'moon',longitude:204.4968705,speed:12.0363544},
 {key:'mercury',longitude:348.7971045,speed:1.8876862},
 {key:'venus',longitude:308.0548115,speed:.8417454},
 {key:'mars',longitude:301.8972242,speed:.7406354},
 {key:'jupiter',longitude:91.3053674,speed:.0560607},
 {key:'saturn',longitude:293.2381107,speed:.0772882},
 {key:'uranus',longitude:279.1872257,speed:.0258918},
 {key:'neptune',longitude:284.2706554,speed:.0179967},
 {key:'pluto',longitude:227.6343071,speed:-.0129830},
 ]
}
