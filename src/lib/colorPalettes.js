export const PALETTES={
  magnitude:{label:'Magnitude — blue → red',type:'sequential',stops:['#58c4dd','#66d0ff','#ffe154','#fc6255']},
  viridis:{label:'Viridis',type:'sequential',stops:['#440154','#3b528b','#21918c','#5ec962','#fde725']},
  plasma:{label:'Plasma',type:'sequential',stops:['#0d0887','#7e03a8','#cc4778','#f89540','#f0f921']},
  inferno:{label:'Inferno',type:'sequential',stops:['#000004','#420a68','#932667','#dd513a','#fca50a','#fcffa4']},
  cividis:{label:'Cividis',type:'sequential',stops:['#00224e','#35456c','#666970','#a58b5f','#fee838']},
  batlow:{label:'Batlow-inspired',type:'sequential',stops:['#011959','#124e6b','#2a7d71','#7eaa6d','#d5c759','#f7e8a4']},
  vik:{label:'Vik-inspired diverging',type:'diverging',stops:['#001261','#3d6db5','#c6d6e2','#f1ece4','#d67c64','#760000']},
  coolwarm:{label:'Cool ↔ warm',type:'diverging',stops:['#3b4cc0','#8db0fe','#dddddd','#f4987a','#b40426']},
  neon:{label:'Neon',type:'sequential',stops:['#32105c','#8b2cff','#00d9ff','#71ff9b','#fff66d']},
  aurora:{label:'Aurora',type:'sequential',stops:['#061a40','#006466','#00a896','#9cffac','#f4f1bb']},
  rainbow:{label:'Direction rainbow',type:'cyclic',stops:['#ff5d5d','#ffd65d','#65df78','#57c7ff','#9b75ff','#ff5dbe','#ff5d5d']},
  cyan:{label:'Cyan',type:'solid',stops:['#4ec4ff']},blue:{label:'Blue',type:'solid',stops:['#4d96ff']},teal:{label:'Teal',type:'solid',stops:['#36d6bd']},green:{label:'Green',type:'solid',stops:['#74d680']},gold:{label:'Gold',type:'solid',stops:['#ffbe54']},orange:{label:'Orange',type:'solid',stops:['#ff8a4c']},red:{label:'Red',type:'solid',stops:['#fc6255']},pink:{label:'Pink',type:'solid',stops:['#ff6faf']},violet:{label:'Violet',type:'solid',stops:['#b273ff']},white:{label:'White',type:'solid',stops:['#e6f3ff']}
};
export const PALETTE_OPTIONS=Object.entries(PALETTES).map(([value,p])=>({value,label:p.label,type:p.type}));
export function paletteStops(name){return(PALETTES[name]||PALETTES.magnitude).stops;}
export function paletteColor(name,t=0.5,alpha=1){const stops=paletteStops(name);if(stops.length===1)return rgba(stops[0],alpha);t=Math.max(0,Math.min(1,t))*(stops.length-1);const i=Math.min(stops.length-2,Math.floor(t)),u=t-i,a=rgbToOklab(hexRgb(stops[i])),b=rgbToOklab(hexRgb(stops[i+1])),rgb=oklabToRgb(a.map((x,k)=>x+(b[k]-x)*u));return `rgba(${rgb.map(x=>Math.round(Math.max(0,Math.min(1,x))*255)).join(',')},${alpha})`;}
export function paletteShader(name){const stops=paletteStops(name).map(hexRgb);if(stops.length===1)return`vec3(${stops[0].map(x=>(x/255).toFixed(5)).join(',')})`;let body='';for(let i=0;i<stops.length-1;i++){const a=stops[i].map(x=>(x/255).toFixed(5)).join(','),b=stops[i+1].map(x=>(x/255).toFixed(5)).join(','),lo=i/(stops.length-1),hi=(i+1)/(stops.length-1);body+=`${i?'else ':''}if(t<=${hi.toFixed(6)})return mix(vec3(${a}),vec3(${b}),clamp((t-${lo.toFixed(6)})/${(hi-lo).toFixed(6)},0.0,1.0));`;}return body+`return vec3(${stops.at(-1).map(x=>(x/255).toFixed(5)).join(',')});`;}
function hexRgb(hex){const h=hex.slice(1);return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgba(hex,a){return`rgba(${hexRgb(hex).join(',')},${a})`;}
function rgbToOklab(rgb){let[r,g,b]=rgb.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}),l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);return[.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];}
function oklabToRgb([L,A,B]){const l=(L+.3963377774*A+.2158037573*B)**3,m=(L-.1055613458*A-.0638541728*B)**3,s=(L-.0894841775*A-1.291485548*B)**3;return[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].map(x=>x<=.0031308?12.92*x:1.055*Math.max(0,x)**(1/2.4)-.055);}
