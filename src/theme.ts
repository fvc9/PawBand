export type PawTheme = { primary: string; hover: string; pressed: string; soft: string; onPrimary: string; secondary: string; accent: string; background: string; surface: string; border: string; text: string; muted: string };
const hexRgb=(hex:string)=>{const h=hex.replace('#','');const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h,16);return {r:n>>16,g:(n>>8)&255,b:n&255}};
const rgbHex=(r:number,g:number,b:number)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
export function generarPaleta(hex:string):PawTheme { const {r,g,b}=hexRgb(/^#[0-9a-f]{6}$/i.test(hex)?hex:'#ECB948'); const [h,s,l]=(()=>{const R=r/255,G=g/255,B=b/255,max=Math.max(R,G,B),min=Math.min(R,G,B),d=max-min;let h=0;if(d){if(max===R)h=((G-B)/d)%6;else if(max===G)h=(B-R)/d+2;else h=(R-G)/d+4;h*=60;if(h<0)h+=360;}return [h,(d===0?0:d/(1-Math.abs(max+min-1)))*100,((max+min)/2)*100]})(); const from=(light:number)=>{const c=(1-Math.abs(2*light/100-1))*s/100,x=c*(1-Math.abs((h/60)%2-1)),m=light/100-c/2;let q:[number,number,number]=[0,0,0];if(h<60)q=[c,x,0];else if(h<120)q=[x,c,0];else if(h<180)q=[0,c,x];else if(h<240)q=[0,x,c];else if(h<300)q=[x,0,c];else q=[c,0,x];return rgbHex(...q.map(v=>(v+m)*255) as [number,number,number])}; const lum=(v:number)=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};const L=.2126*lum(r)+.7152*lum(g)+.0722*lum(b);return {primary:hex,hover:from(Math.max(12,l-8)),pressed:from(Math.max(8,l-14)),soft:from(Math.min(94,l+30)),onPrimary:((Math.max(L,.025)+.05)/(Math.min(L,.025)+.05))>=((1.05)/(L+.05))?'#3B2A0A':'#FFF8E3',secondary:'#D9642E',accent:'#2F8F83',background:'#FFF0C9',surface:'#FFF8E3',border:'#EBD28A',text:'#3B2A0A',muted:'#7A6330'} }
export function aplicarTema(hex:string, style='Miel'){const p=generarPaleta(hex);const root=document.documentElement;Object.entries(p).forEach(([k,v])=>root.style.setProperty('--paw-'+k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),v));root.dataset.pawTheme=style;}

export const uiRegistry = [
 { id: 'home.metrics', label: 'Datos pequeños', grupo: 'Inicio', ocultable: true },
 { id: 'home.chart', label: 'Gráfico de actividad', grupo: 'Inicio', ocultable: true },
 { id: 'home.last-alert', label: 'Última alerta', grupo: 'Inicio', ocultable: true },
 { id: 'home.camera', label: 'Tarjeta de cámara', grupo: 'Inicio', ocultable: true },
 { id: 'home.summary', label: 'Resumen de hoy', grupo: 'Inicio', ocultable: true },
 { id: 'home.barks', label: 'Ladridos de hoy', grupo: 'Inicio', ocultable: true },
 { id: 'home.quick-actions', label: 'Acciones rápidas', grupo: 'Inicio', ocultable: true },
 { id: 'nav.home', label: 'Inicio', grupo: 'Navegación', ocultable: true },
 { id: 'nav.activity', label: 'Actividad', grupo: 'Navegación', ocultable: true },
 { id: 'nav.trends', label: 'Tendencias', grupo: 'Navegación', ocultable: true },
 { id: 'nav.settings', label: 'Ajustes', grupo: 'Navegación', ocultable: false },
] as const;
