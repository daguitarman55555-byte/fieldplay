const FUNCTIONS=['sin','cos','tan','arcsin','arccos','arctan','sinh','cosh','tanh','sqrt','abs','exp','ln','log'];

export function parseDesmosVectorField(latex){
  const normalized=normalizeDesmosLatex(latex),equal=findTopLevel(normalized,'=');
  if(equal<0)return null;
  const left=normalized.slice(0,equal),right=normalized.slice(equal+1),signature=/^([A-Za-z](?:_[A-Za-z0-9]+)?)\(x,y\)$/.exec(left);
  const delimiters=right[0]==='('&&right.at(-1)===')'||right[0]==='<'&&right.at(-1)==='>';
  if(!signature||!delimiters)return null;
  const components=splitTopLevel(right.slice(1,-1),',');
  if(components.length!==2||components.some(x=>!x.trim()))return null;
  return{name:signature[1],x:components[0],y:components[1],source:latex};
}

export function normalizeDesmosLatex(latex){
  let value=String(latex||'').replace(/\\left|\\right/g,'').replace(/\\langle/g,'<').replace(/\\rangle/g,'>').replace(/\\cdot|\\times/g,'*').replace(/\\,/g,'').replace(/\s+/g,'');
  value=value.replace(/\\operatorname\{([A-Za-z]+)\}/g,'$1');
  FUNCTIONS.forEach(name=>{value=value.replace(new RegExp(`\\\\${name}\\b`,'g'),name);});
  value=value.replace(/\\pi/g,'pi').replace(/\\theta/g,'theta').replace(/\^\{([^{}]+)\}/g,'^($1)').replace(/_\{([^{}]+)\}/g,'_$1');
  for(let pass=0;pass<8&&value.includes('\\frac');pass++)value=replaceFirstFraction(value);
  return value;
}

export function splitTopLevel(value,separator){const result=[];let depth=0,start=0;for(let i=0;i<value.length;i++){const c=value[i];if(c==='('||c==='['||c==='{')depth++;else if(c===')'||c===']'||c==='}')depth--;else if(c===separator&&depth===0){result.push(value.slice(start,i));start=i+1;}}result.push(value.slice(start));return result;}
function findTopLevel(value,target){let depth=0;for(let i=0;i<value.length;i++){const c=value[i];if(c==='('||c==='['||c==='{')depth++;else if(c===')'||c===']'||c==='}')depth--;else if(c===target&&depth===0)return i;}return-1;}
function replaceFirstFraction(value){const start=value.indexOf('\\frac');if(start<0)return value;const numerator=groupAt(value,start+5);if(!numerator)return value.replace('\\frac','');const denominator=groupAt(value,numerator.end);if(!denominator)return value.replace('\\frac','');return value.slice(0,start)+`((${numerator.text})/(${denominator.text}))`+value.slice(denominator.end);}
function groupAt(value,index){if(value[index]!=='{')return null;let depth=0;for(let i=index;i<value.length;i++){if(value[i]==='{')depth++;else if(value[i]==='}'&&--depth===0)return{text:value.slice(index+1,i),end:i+1};}return null;}
