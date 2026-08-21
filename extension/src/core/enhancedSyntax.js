export function parseEnhancedSyntax(source){
  const text=String(source||'').trim();if(!text)return null;let match;
  if((match=/^(?:vec|vector)\s+([A-Za-z]\w*)(?:\(([^)]*)\))?\s*=\s*<(.+)>$/i.exec(text))){const components=split(match[3]);return{kind:match[2]?'vector-field':'vector',name:match[1],variables:split(match[2]||''),components,latex:`\\vec{${match[1]}}${match[2]?`(${match[2]})`:''}=\\left\\langle ${components.join(',')}\\right\\rangle`};}
  if((match=/^(?:slope\s+)?y'\s*=\s*(.+)$/i.exec(text)))return{kind:'slope-field',dependent:'y',expression:match[1],latex:`y'=${match[1]}`};
  if((match=/^partial\s+((?:[A-Za-z]\s+)+)(.+)$/i.exec(text))){const variables=match[1].trim().split(/\s+/);return{kind:'partial',variables,expression:match[2],latex:partialLatex(variables,match[2])};}
  if((match=/^d\s+(\d+|[A-Za-z]\w*)\s+([A-Za-z])\s+(.+)$/i.exec(text)))return{kind:'derivative',order:match[1],variable:match[2],expression:match[3],latex:`\\frac{d^{${match[1]}}}{d${match[2]}^{${match[1]}}}\\left(${match[3]}\\right)`};
  if((match=/^(grad|div|curl|jacobian|hessian|laplacian)\s+(.+)$/i.exec(text)))return{kind:match[1].toLowerCase(),expression:match[2],latex:operatorLatex(match[1].toLowerCase(),match[2])};
  if((match=/^int\s+(.+)\s+d([A-Za-z])$/i.exec(text)))return{kind:'integral',integrand:match[1],differential:match[2],latex:`\\int ${match[1]}\\,d${match[2]}`};
  if((match=/^lineint\s+(.+)$/i.exec(text)))return{kind:'line-integral',expression:match[1],latex:`\\int_C ${match[1]}`};
  return null;
}
function split(value){return value?value.split(',').map(x=>x.trim()).filter(Boolean):[];}
function partialLatex(vars,expression){const counts=new Map();vars.forEach(v=>counts.set(v,(counts.get(v)||0)+1));const denominator=[...counts].map(([v,n])=>`\\partial ${v}${n>1?`^{${n}}`:''}`).join('');return`\\frac{\\partial^{${vars.length}}}{${denominator}}\\left(${expression}\\right)`;}
function operatorLatex(kind,expression){return({grad:'\\nabla ',div:'\\nabla\\cdot ',curl:'\\nabla\\times ',jacobian:'J_',hessian:'H_',laplacian:'\\nabla^2 '}[kind]||'')+expression;}
