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
  turbo:{label:'Turbo',type:'sequential',stops:['#30123b','#466be3','#28bceb','#32f298','#a4fc3c','#f9ba38','#e44818','#7a0403']},
  cubehelix:{label:'Cubehelix',type:'sequential',stops:['#000000','#18244e','#16534c','#6b6b38','#c681a0','#ffffff']},
  spectral:{label:'Spectral',type:'diverging',stops:['#9e0142','#f46d43','#fee08b','#ffffbf','#e6f598','#66c2a5','#5e4fa2']},
  twilight:{label:'Twilight',type:'cyclic',stops:['#e2d9e2','#6f75b5','#1e1e2f','#9b425e','#e2d9e2']},
  rainbow:{label:'Direction rainbow',type:'cyclic',stops:['#ff5d5d','#ffd65d','#65df78','#57c7ff','#9b75ff','#ff5dbe','#ff5d5d']},
  studio:{label:'Custom gradient',type:'sequential',stops:['#32105c','#00d9ff','#fff66d']},
  cyan:{label:'Cyan',type:'solid',stops:['#4ec4ff']},blue:{label:'Blue',type:'solid',stops:['#4d96ff']},teal:{label:'Teal',type:'solid',stops:['#36d6bd']},green:{label:'Green',type:'solid',stops:['#74d680']},gold:{label:'Gold',type:'solid',stops:['#ffbe54']},orange:{label:'Orange',type:'solid',stops:['#ff8a4c']},red:{label:'Red',type:'solid',stops:['#fc6255']},pink:{label:'Pink',type:'solid',stops:['#ff6faf']},violet:{label:'Violet',type:'solid',stops:['#b273ff']},white:{label:'White',type:'solid',stops:['#e6f3ff']}
};
export const PALETTE_OPTIONS=Object.entries(PALETTES).map(([value,p])=>({value,label:p.label,type:p.type}));
export function paletteStops(name){return(PALETTES[name]||PALETTES.magnitude).stops;}
export function paletteGradient(name){return`linear-gradient(90deg, ${paletteStops(name).join(', ')})`;}
export function setCustomGradient(stops){if(Array.isArray(stops)&&stops.length>=2&&stops.every(x=>/^#[0-9a-f]{6}$/i.test(x)))PALETTES.studio.stops=stops.slice();return PALETTES.studio.stops;}
export function paletteColor(name,t=0.5,alpha=1){const stops=paletteStops(name);if(stops.length===1)return rgba(stops[0],alpha);t=Math.max(0,Math.min(1,Number.isFinite(t)?t:0))*(stops.length-1);const i=Math.min(stops.length-2,Math.floor(t)),u=t-i,a=hexRgb(stops[i]),b=hexRgb(stops[i+1]),rgb=a.map((x,k)=>Math.round(x+(b[k]-x)*u));return `rgba(${rgb.join(',')},${Math.max(0,Math.min(1,Number.isFinite(alpha)?alpha:1))})`;}
export function paletteShader(name){const stops=paletteStops(name).map(hexRgb);if(stops.length===1)return`vec3(${stops[0].map(x=>(x/255).toFixed(5)).join(',')})`;let body='';for(let i=0;i<stops.length-1;i++){const a=stops[i].map(x=>(x/255).toFixed(5)).join(','),b=stops[i+1].map(x=>(x/255).toFixed(5)).join(','),lo=i/(stops.length-1),hi=(i+1)/(stops.length-1);body+=`${i?'else ':''}if(t<=${hi.toFixed(6)})return mix(vec3(${a}),vec3(${b}),clamp((t-${lo.toFixed(6)})/${(hi-lo).toFixed(6)},0.0,1.0));`;}return body+`return vec3(${stops.at(-1).map(x=>(x/255).toFixed(5)).join(',')});`;}
export function particlePaletteShader(name,custom='#4ec4ff'){
  if(name==='rainbow')return`vec4 get_color(vec2 p){vec2 v=get_velocity(p);float h=(atan(v.y,v.x)+PI)/(2.0*PI);return vec4(hsv2rgb(vec3(h,0.82,1.0)),1.0);}`;
  const palette=PALETTES[name];
  if(name==='custom'||palette?.type==='solid'){
    const [r,g,b]=hexRgb(name==='custom'?normalHex(custom):palette.stops[0]).map(x=>(x/255).toFixed(5));
    return`vec4 get_color(vec2 p){return vec4(${r},${g},${b},1.0);}`;
  }
  // Keep the darkest endpoint visible against FieldPlay's dark backgrounds while
  // preserving the selected palette everywhere else.
  return`vec3 studio_palette(float t){${paletteShader(name)}} vec4 get_color(vec2 p){float span=max(0.000001,u_velocity_range.y-u_velocity_range.x);float s=clamp((length(get_velocity(p))-u_velocity_range.x)/span,0.0,1.0);s=0.035+0.965*s;vec3 c=studio_palette(s);return vec4(clamp(c*1.06+vec3(0.012),0.0,1.0),1.0);}`;
}
function hexRgb(hex){const h=hex.slice(1);return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgba(hex,a){return`rgba(${hexRgb(hex).join(',')},${a})`;}
function normalHex(value){return/^#[0-9a-f]{6}$/i.test(String(value))?String(value):'#4ec4ff';}
