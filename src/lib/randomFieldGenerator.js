const FAMILIES = [
  linearFlow, spiralFlow, waveFlow, cellularFlow, coupledSines,
  polynomialFlow, softDipole, radialWaves, shearWaves, gyreFlow,
  nonlinearOscillator, softAttractors, polarSwirl, latticeFlow,
  asymmetricVortex, harmonicMix, cubicCells, saddleWaves,
  rotatingWaves, softQuadrupole
];

export function generateRandomField(random = Math.random) {
  const seed = Math.floor(clamp01(random()) * 0x100000000) >>> 0;
  const rng = mulberry32(seed || 1);
  const familyIndex = Math.floor(rng() * FAMILIES.length);
  const field = FAMILIES[familyIndex](rng);
  return {
    ...field,
    name: `Generated ${String(seed).padStart(10, '0')}`,
    seed,
    family: familyIndex,
    signature: `${field.x}|${field.y}`
  };
}

function linearFlow(r){const[a,b,c,d]=coefficients(r,4,.15,1.35);return field(`${a}*x+${b}*y`,`${c}*x+${d}*y`,range(r,7,13));}
function spiralFlow(r){const a=num(r,.08,.52),s=sign(r),w=num(r,.55,1.7);return field(`${s*a}*x-${w}*y`,`${w}*x+${s*a}*y`,range(r,8,14));}
function waveFlow(r){const a=int(r,1,5),b=int(r,1,5),c=num(r,.15,.9);return field(`sin(${a}*y)+${c}*cos(${b}*x)`,`cos(${b}*x)-${c}*sin(${a}*y)`,range(r,9,16));}
function cellularFlow(r){const a=int(r,1,4),b=int(r,1,4),c=num(r,.3,1.2);return field(`${c}*sin(${a}*x)*cos(${b}*y)`,`-${c}*cos(${a}*x)*sin(${b}*y)`,range(r,8,15));}
function coupledSines(r){const[a,b,c,d]=coefficients(r,4,.25,1.4),m=int(r,1,4),n=int(r,1,4);return field(`${a}*sin(${m}*y)+${b}*cos(${n}*x)`,`${c}*sin(${n}*x)+${d}*cos(${m}*y)`,range(r,9,16));}
function polynomialFlow(r){const[a,b,c,d]=coefficients(r,4,.04,.28);return field(`${a}*x^3+${b}*x*y^2-y`,`${c}*y^3+${d}*x^2*y+x`,range(r,5,9));}
function softDipole(r){const a=num(r,.3,1.8),d=num(r,.2,1.1),s=sign(r);return field(`${s*a}*(x^2-y^2)/(x^2+y^2+${d})^2`,`${2*a}*x*y/(x^2+y^2+${d})^2`,range(r,5,10));}
function radialWaves(r){const a=int(r,1,5),b=num(r,.15,.8),s=sign(r),d=num(r,.08,.5);return field(`${s}*x+${b}*cos(${a}*r)*y/sqrt(r^2+${d})`,`${s}*y-${b}*sin(${a}*r)*x/sqrt(r^2+${d})`,range(r,7,13));}
function shearWaves(r){const a=num(r,.2,1.4),b=int(r,1,5),c=num(r,.1,.8);return field(`${a}*y+${c}*sin(${b}*x)`,`${sign(r)*c}*cos(${b}*y)`,range(r,8,15));}
function gyreFlow(r){const a=int(r,1,4),b=int(r,1,4),c=num(r,.1,.75);return field(`sin(${a}*y)+${c}*sin(${b}*x)`,`sin(${a}*x)-${c}*sin(${b}*y)`,range(r,9,16));}
function nonlinearOscillator(r){const a=num(r,.05,.55),b=num(r,.1,.9),c=num(r,.1,.75);return field(`y`, `-${a}*y-${b}*x-${c}*x^3`,range(r,6,11));}
function softAttractors(r){const a=num(r,.2,1.1),b=num(r,.2,1.1),c=num(r,.2,1.2);return field(`-${a}*x+${c}*sin(${int(r,1,4)}*y)`,`-${b}*y+${c}*sin(${int(r,1,4)}*x)`,range(r,7,13));}
function polarSwirl(r){const a=num(r,.1,.8),b=num(r,.3,1.4),c=num(r,.1,.7);return field(`${a}*x-${b}*y+${c}*sin(${int(r,1,5)}*r)`,`${b}*x+${a}*y+${c}*cos(${int(r,1,5)}*r)`,range(r,7,13));}
function latticeFlow(r){const a=int(r,1,5),b=int(r,1,5),c=num(r,.2,1.1);return field(`${c}*(sin(${a}*x)+sin(${b}*y))`,`${c}*(cos(${b}*x)-cos(${a}*y))`,range(r,8,15));}
function asymmetricVortex(r){const a=num(r,.45,1.5),b=num(r,.45,1.5),c=num(r,.05,.5);return field(`-${a}*y-${c}*x`,`${b}*x-${c}*y`,range(r,7,13));}
function harmonicMix(r){const a=int(r,1,4),b=int(r,2,6),c=num(r,.1,.65);return field(`sin(${a}*y)+${c}*sin(${b}*y)`,`cos(${a}*x)-${c}*cos(${b}*x)`,range(r,9,16));}
function cubicCells(r){const a=num(r,.03,.22),b=num(r,.2,1),s=sign(r);return field(`${s*a}*(x^3-3*x*y^2)+${b}*y`,`${a}*(y^3-3*x^2*y)-${b}*x`,range(r,5,9));}
function saddleWaves(r){const a=num(r,.2,1.2),b=num(r,.1,.8),m=int(r,1,5);return field(`${a}*x+${b}*sin(${m}*y)`,`-${a}*y+${b}*cos(${m}*x)`,range(r,7,13));}
function rotatingWaves(r){const a=num(r,.35,1.4),b=num(r,.1,.8),m=int(r,1,5);return field(`-${a}*y+${b}*cos(${m}*x)`,`${a}*x+${b}*sin(${m}*y)`,range(r,8,14));}
function softQuadrupole(r){const a=num(r,.2,1.2),d=num(r,.4,1.5),s=sign(r);return field(`${s*a}*x*y/(x^2+y^2+${d})`,`0.5*${a}*(x^2-y^2)/(x^2+y^2+${d})`,range(r,6,12));}

function field(x,y,bounds){return{x,y,bounds};}
function coefficients(r,count,min,max){return Array.from({length:count},()=>`${sign(r)*num(r,min,max)}`);}
function sign(r){return r()<.5?-1:1;}
function int(r,min,max){return Math.floor(r()*(max-min+1))+min;}
function range(r,min,max){return int(r,min,max);}
function num(r,min,max){return Number((min+r()*(max-min)).toFixed(3));}
function clamp01(value){const number=Number(value);return Number.isFinite(number)?Math.max(0,Math.min(1-Number.EPSILON,number)):0;}
function mulberry32(seed){let state=seed>>>0;return()=>{state=(state+0x6D2B79F5)|0;let t=Math.imul(state^(state>>>15),1|state);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
