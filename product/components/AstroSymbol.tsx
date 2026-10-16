import type {SVGProps} from 'react'

// Consistent line symbols, independent of platform fonts and emoji rendering.
const paths: Record<string, string> = {
 sun:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M12 11v2',
 moon:'M15 3a9 9 0 1 0 0 18 10 10 0 0 1 0-18Z',
 mercury:'M7 3a5 5 0 0 0 10 0 M17 10a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M12 15v7 M8 19h8',
 venus:'M18 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M12 14v8 M8 19h8',
 mars:'M15 15a6 6 0 1 1-12 0 6 6 0 0 1 12 0 M13 11l8-8 M15 3h6v6',
 jupiter:'M5 5c8-3 9 5 0 10h15 M16 3v19',
 saturn:'M8 2v16 M4 6h8 M8 12c7-7 13-1 8 5-3 4-1 5 2 4',
 uranus:'M5 3v12 M19 3v12 M5 9h14 M12 3v14 M15 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 neptune:'M5 4v5a7 7 0 0 0 14 0V4 M12 2v20 M8 18h8 M3 6l2-2 2 2 M17 6l2-2 2 2',
 pluto:'M15 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M5 6a7 7 0 0 0 14 0 M12 13v9 M8 18h8',
 aries:'M12 21V9C12 1 2 1 4 10 M12 9C12 1 22 1 20 10',
 taurus:'M5 2c0 8 14 8 14 0 M18 15a6 6 0 1 1-12 0 6 6 0 0 1 12 0',
 gemini:'M5 3c4 2 10 2 14 0 M5 21c4-2 10-2 14 0 M8 5v14 M16 5v14',
 cancer:'M3 7c4-5 13-5 18 0 M3 17c5 5 14 5 18 0 M10 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 leo:'M9 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M8 14C-1 0 21-2 17 9l-4 9c-1 4 5 5 8 0',
 virgo:'M3 4v14 M3 8c0-5 5-5 5 0v10 M8 8c0-5 5-5 5 0v8 M13 8c7-5 12 5 0 12 M16 6v11l5 4',
 libra:'M3 20h18 M3 15h5a6 6 0 1 1 8 0h5',
 scorpio:'M3 4v14 M3 8c0-5 5-5 5 0v10 M8 8c0-5 5-5 5 0v8q0 5 8 3 M18 16l3 3-3 3',
 sagittarius:'M4 20 20 4 M11 4h9v9 M5 9l10 10',
 capricorn:'M3 7c0-5 5-5 5 0v11 M8 7c0-5 5-5 5 0v9c0 7 9 7 9 1s-9-5-9 1',
 aquarius:'M2 9l4-4 4 4 4-4 4 4 4-4 M2 19l4-4 4 4 4-4 4 4 4-4',
 pisces:'M5 3c6 5 6 13 0 18 M19 3c-6 5-6 13 0 18 M3 12h18',
}
export function AstroSymbol({name,...props}:SVGProps<SVGSVGElement>&{name:string}) {
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]}/></svg>
}
