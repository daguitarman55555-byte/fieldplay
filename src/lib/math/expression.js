const CONSTANTS = {pi:Math.PI,e:Math.E,tau:Math.PI*2,phi:(1+Math.sqrt(5))/2,sqrt2:Math.SQRT2,ln2:Math.LN2,ln10:Math.LN10};
const FUNCTIONS={
  sin:def(1,Math.sin),cos:def(1,Math.cos),tan:def(1,Math.tan),
  asin:def(1,Math.asin),arcsin:alias('asin'),acos:def(1,Math.acos),arccos:alias('acos'),
  atan:def([1,2],(...a)=>a.length===2?Math.atan2(a[0],a[1]):Math.atan(a[0])),arctan:alias('atan'),atan2:alias('atan'),
  sec:custom(1,x=>1/Math.cos(x),a=>`(1.0/cos(${a[0]}))`),csc:custom(1,x=>1/Math.sin(x),a=>`(1.0/sin(${a[0]}))`),cot:custom(1,x=>1/Math.tan(x),a=>`(1.0/tan(${a[0]}))`),
  sinh:custom(1,Math.sinh,a=>`((exp(${a[0]})-exp(-(${a[0]})))*0.5)`),cosh:custom(1,Math.cosh,a=>`((exp(${a[0]})+exp(-(${a[0]})))*0.5)`),tanh:custom(1,Math.tanh,a=>`((exp(2.0*(${a[0]}))-1.0)/(exp(2.0*(${a[0]}))+1.0))`),
  asinh:custom(1,Math.asinh,a=>`log((${a[0]})+sqrt((${a[0]})*(${a[0]})+1.0))`),arcsinh:alias('asinh'),
  acosh:custom(1,Math.acosh,a=>`log((${a[0]})+sqrt((${a[0]})-1.0)*sqrt((${a[0]})+1.0))`),arccosh:alias('acosh'),
  atanh:custom(1,Math.atanh,a=>`(0.5*log((1.0+(${a[0]}))/(1.0-(${a[0]}))))`),arctanh:alias('atanh'),
  abs:def(1,Math.abs),sqrt:def(1,Math.sqrt),cbrt:custom(1,Math.cbrt,a=>`(sign(${a[0]})*pow(abs(${a[0]}),0.3333333333333333))`),
  exp:def(1,Math.exp),exp2:custom(1,x=>2**x,a=>`exp2(${a[0]})`),log:def(1,Math.log),ln:alias('log'),
  log2:custom(1,Math.log2,a=>`log2(${a[0]})`),log10:custom(1,Math.log10,a=>`(log(${a[0]})/2.302585092994046)`),logb:custom(2,(x,b)=>Math.log(x)/Math.log(b),a=>`(log(${a[0]})/log(${a[1]}))`),
  floor:def(1,Math.floor),ceil:def(1,Math.ceil),round:custom(1,Math.round,a=>`(sign(${a[0]})*floor(abs(${a[0]})+0.5))`),trunc:custom(1,Math.trunc,a=>`(sign(${a[0]})*floor(abs(${a[0]})))`),fract:custom(1,x=>x-Math.floor(x),a=>`fract(${a[0]})`),sign:def(1,Math.sign),
  min:custom([2,16],Math.min,a=>foldGLSL('min',a)),max:custom([2,16],Math.max,a=>foldGLSL('max',a)),pow:def(2,Math.pow),mod:custom(2,(x,y)=>x-y*Math.floor(x/y),a=>`mod(${a[0]},${a[1]})`),
  hypot:custom([2,16],(...a)=>Math.hypot(...a),a=>`sqrt(${a.map(x=>`(${x})*(${x})`).join('+')})`),
  clamp:custom(3,(x,a,b)=>Math.min(b,Math.max(a,x)),a=>`clamp(${a.join(',')})`),mix:custom(3,(a,b,t)=>a+(b-a)*t,a=>`mix(${a.join(',')})`),lerp:alias('mix'),
  select:custom(3,(condition,a,b)=>condition!==0?a:b,a=>`mix(${a[2]},${a[1]},step(0.5,abs(${a[0]})))`),piecewise:alias('select'),
  lt:custom(2,(a,b)=>a<b?1:0,a=>`(1.0-step(${a[1]},${a[0]}))`),lte:custom(2,(a,b)=>a<=b?1:0,a=>`(1.0-step(${a[1]}+0.0000001,${a[0]}))`),gt:custom(2,(a,b)=>a>b?1:0,a=>`step(${a[1]}+0.0000001,${a[0]})`),gte:custom(2,(a,b)=>a>=b?1:0,a=>`step(${a[1]},${a[0]})`),eq:custom(2,(a,b)=>Math.abs(a-b)<1e-9?1:0,a=>`(1.0-step(0.000001,abs(${a[0]}-${a[1]})))`),between:custom(3,(x,a,b)=>x>=a&&x<=b?1:0,a=>`(step(${a[1]},${a[0]})*(1.0-step(${a[2]}+0.0000001,${a[0]})))`),
  step:custom(2,(edge,x)=>x<edge?0:1,a=>`step(${a.join(',')})`),smoothstep:custom(3,(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);},a=>`smoothstep(${a.join(',')})`),
  radians:custom(1,x=>x*Math.PI/180,a=>`radians(${a[0]})`),degrees:custom(1,x=>x*180/Math.PI,a=>`degrees(${a[0]})`),root:custom(2,(x,n)=>Math.sign(x)*Math.abs(x)**(1/n),a=>`(sign(${a[0]})*pow(abs(${a[0]}),1.0/(${a[1]})))`)
};

export function parseExpression(source) {
  const tokens=tokenize(source); let cursor=0;
  const peek=()=>tokens[cursor]; const take=()=>tokens[cursor++];
  function expression(min=0){
    let left=prefix();
    while(peek()){
      const implicit=isImplicitFactor(peek()),priority=implicit?2:peek().type==='op'?precedence(peek().value):-1;
      if(priority<min)break;
      const op=implicit?'*':take().value;
      const right=expression(priority+(op==='^'?0:1)); left={type:'binary',op,left,right};
    }
    return left;
  }
  function prefix(){
    const token=take(); if(!token) throw syntax('Unexpected end of expression');
    if(token.type==='number') return {type:'number',value:Number(token.value)};
    if(token.type==='op' && (token.value==='+'||token.value==='-')) return {type:'unary',op:token.value,value:prefix()};
    if(token.type==='paren'&&token.value==='('){const value=expression();expect('paren',')');return value;}
    if(token.type==='name'){
      if(peek()?.value==='('){
        const name=token.value.toLowerCase();if(!FUNCTIONS[name]) throw syntax(`Unknown function: ${token.value}`);
        take(); const args=[]; if(peek()?.value!==')'){do{args.push(expression());if(peek()?.value!==',')break;take();}while(true);}
        expect('paren',')');validateArity(name,args.length);return {type:'call',name,args};
      }
      return {type:'name',name:token.value};
    }
    throw syntax(`Unexpected token: ${token.value}`);
  }
  function expect(type,value){const token=take();if(!token||token.type!==type||token.value!==value)throw syntax(`Expected ${value}`);}
  const ast=expression(); if(peek()) throw syntax(`Unexpected token: ${peek().value}`); return ast;
}

function isImplicitFactor(token){return token?.type==='number'||token?.type==='name'||(token?.type==='paren'&&token.value==='(');}

export function compileExpression(source, parameters = {}, options={}) {
  const ast=parseExpression(source);
  const names=collectNames(ast);
  names.forEach(name=>{if(!['x','y','r','theta','t'].includes(name)&&!(name in CONSTANTS)&&!(name in parameters))throw syntax(`Unknown symbol: ${name}`);});
  return {
    ast,
    glsl: toGLSL(ast,parameters),
    warnings:expressionWarnings(source),
    evaluate(x,y,t=options.time||0){return evaluate(ast,{x,y,r:Math.hypot(x,y),theta:Math.atan2(y,x),t,...CONSTANTS,...parameters});}
  };
}

export function compileVectorField(xSource,ySource,parameters={},definitions=''){
  const userFunctions=parseUserFunctions(definitions),expandedX=expandUserFunctions(xSource,userFunctions),expandedY=expandUserFunctions(ySource,userFunctions),x=compileExpression(expandedX,parameters),y=compileExpression(expandedY,parameters);
  return {
    code:`vec2 get_velocity(vec2 p) {\n  float x = p.x;\n  float y = p.y;\n  float r = length(p);\n  float theta = atan(y,x);\n  float t = frame * 0.016666667;\n  return vec2(${x.glsl}, ${y.glsl});\n}`,
    evaluate(px,py,t=0){return [x.evaluate(px,py,t),y.evaluate(px,py,t)];},
    expressions:{x:String(xSource),y:String(ySource)},expanded:{x:expandedX,y:expandedY},definitions:String(definitions||''),parameters:{...parameters},warnings:[...x.warnings,...y.warnings]
  };
}

export function compileGradientField(source,parameters={},epsilon=.001){
  const scalar=compileExpression(source,parameters),e=Math.min(.1,Math.max(.000001,Number(epsilon)||.001));
  return {
    code:`float studio_scalar(vec2 p) {\n  float x = p.x;\n  float y = p.y;\n  float r = length(p);\n  float theta = atan(y,x);\n  float t = frame * 0.016666667;\n  return ${scalar.glsl};\n}\nvec2 get_velocity(vec2 p) {\n  float e = ${glslNumber(e)};\n  return vec2(studio_scalar(p+vec2(e,0.0))-studio_scalar(p-vec2(e,0.0)), studio_scalar(p+vec2(0.0,e))-studio_scalar(p-vec2(0.0,e))) / (2.0*e);\n}`,
    evaluate(x,y){return [(scalar.evaluate(x+e,y)-scalar.evaluate(x-e,y))/(2*e),(scalar.evaluate(x,y+e)-scalar.evaluate(x,y-e))/(2*e)];},
    scalar:(x,y)=>scalar.evaluate(x,y),expression:String(source),parameters:{...parameters},epsilon:e
  };
}

export function parseParameters(source){
  const output={}; String(source||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean).forEach(item=>{
    const match=/^([A-Za-z_]\w*)\s*=\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)$/i.exec(item);
    if(!match||match[1]==='x'||match[1]==='y'||match[1] in CONSTANTS)throw syntax(`Invalid parameter: ${item}`);
    output[match[1]]=Number(match[2]);
  }); return output;
}

export function parseUserFunctions(source){const functions={};String(source||'').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(line=>{const match=/^([A-Za-z_]\w*)\s*\(([^)]*)\)\s*=\s*(.+)$/.exec(line);if(!match)throw syntax(`Invalid function definition: ${line}`);const args=match[2].split(',').map(x=>x.trim()).filter(Boolean);if(!args.length||args.some(x=>!/^[A-Za-z_]\w*$/.test(x)))throw syntax(`Invalid function arguments: ${line}`);functions[match[1]]={args,body:match[3]};});return functions;}
export function expandUserFunctions(source,functions){let result=String(source);for(let pass=0;pass<12;pass++){let changed=false;for(const[name,fn]of Object.entries(functions||{})){const re=new RegExp(`\\b${name}\\s*\\(`,'g'),calls=[];let match;while((match=re.exec(result))){const open=result.indexOf('(',match.index),close=matchingParen(result,open);if(close<0)throw syntax(`Unclosed call to ${name}`);calls.push([match.index,open,close]);re.lastIndex=close+1;}for(let i=calls.length-1;i>=0;i--){const[start,open,close]=calls[i],values=splitArguments(result.slice(open+1,close));if(values.length!==fn.args.length)throw syntax(`${name} expects ${fn.args.length} arguments`);let body=fn.body;fn.args.forEach((arg,k)=>{body=body.replace(new RegExp(`\\b${arg}\\b`,'g'),`(${values[k]})`);});result=result.slice(0,start)+`(${body})`+result.slice(close+1);changed=true;}}if(!changed)return result;}throw syntax('User functions are recursively defined or too deeply nested');}
function matchingParen(text,open){let depth=0;for(let i=open;i<text.length;i++){if(text[i]==='(')depth++;else if(text[i]===')'&&--depth===0)return i;}return-1;}
function splitArguments(text){const out=[];let depth=0,start=0;for(let i=0;i<text.length;i++){if(text[i]==='(')depth++;else if(text[i]===')')depth--;else if(text[i]===','&&depth===0){out.push(text.slice(start,i).trim());start=i+1;}}out.push(text.slice(start).trim());return out;}

function tokenize(source){
  const tokens=[]; const text=String(source||''); let i=0;
  while(i<text.length){
    if(/\s/.test(text[i])){i++;continue;}
    const number=/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i.exec(text.slice(i));
    if(number){tokens.push({type:'number',value:number[0]});i+=number[0].length;continue;}
    const name=/^[A-Za-z_]\w*/.exec(text.slice(i));
    if(name){tokens.push({type:'name',value:name[0]});i+=name[0].length;continue;}
    const char=text[i++];
    if('+-*/^'.includes(char))tokens.push({type:'op',value:char});
    else if('()'.includes(char))tokens.push({type:'paren',value:char});
    else if(char===',')tokens.push({type:'comma',value:char});
    else throw syntax(`Unsupported character: ${char}`);
  } return tokens;
}
function precedence(op){return op==='+'||op==='-'?1:op==='*'||op==='/'?2:op==='^'?3:-1;}
function collectNames(ast,set=new Set()){if(ast.type==='name')set.add(ast.name);if(ast.value&&typeof ast.value==='object')collectNames(ast.value,set);if(ast.left)collectNames(ast.left,set);if(ast.right)collectNames(ast.right,set);ast.args?.forEach(x=>collectNames(x,set));return set;}
function toGLSL(ast,parameters){
  if(ast.type==='number')return Number.isInteger(ast.value)?`${ast.value.toFixed(1)}`:`${ast.value}`;
  if(ast.type==='name'){if(ast.name in CONSTANTS)return glslNumber(CONSTANTS[ast.name]);if(ast.name in parameters)return glslNumber(parameters[ast.name]);return ast.name;}
  if(ast.type==='unary')return `(${ast.op}${toGLSL(ast.value,parameters)})`;
  if(ast.type==='binary'){const l=toGLSL(ast.left,parameters),r=toGLSL(ast.right,parameters);return ast.op==='^'?`pow(${l}, ${r})`:`(${l} ${ast.op} ${r})`;}
  const args=ast.args.map(x=>toGLSL(x,parameters)),fn=resolveFunction(ast.name);return fn.glsl?fn.glsl(args):`${fn.name||ast.name}(${args.join(',')})`;
}
function evaluate(ast,scope){
  if(ast.type==='number')return ast.value;if(ast.type==='name')return scope[ast.name];if(ast.type==='unary')return ast.op==='-'?-evaluate(ast.value,scope):evaluate(ast.value,scope);
  if(ast.type==='binary'){const a=evaluate(ast.left,scope),b=evaluate(ast.right,scope);return ast.op==='+'?a+b:ast.op==='-'?a-b:ast.op==='*'?a*b:ast.op==='/'?a/b:a**b;}
  const args=ast.args.map(x=>evaluate(x,scope));return resolveFunction(ast.name).evaluate(...args);
}
function glslNumber(value){const n=Number(value);return Number.isInteger(n)?n.toFixed(1):String(n);}
function syntax(message){return new Error(message);}
function def(arity,evaluate){return{arity,evaluate};}
function custom(arity,evaluate,glsl){return{arity,evaluate,glsl};}
function alias(name){return{alias:name};}
function foldGLSL(name,args){return args.slice(1).reduce((value,arg)=>`${name}(${value},${arg})`,args[0]);}
function resolveFunction(name){let canonical=name,fn=FUNCTIONS[canonical];while(fn?.alias){canonical=fn.alias;fn=FUNCTIONS[canonical];}return{...fn,name:canonical};}
function validateArity(name,count){const fn=resolveFunction(name),range=Array.isArray(fn.arity)?fn.arity:[fn.arity,fn.arity];if(count<range[0]||count>range[1])throw syntax(`${name} expects ${range[0]===range[1]?range[0]:`${range[0]}–${range[1]}`} argument${range[1]===1?'':'s'}, received ${count}`);}
export function expressionWarnings(source){const s=String(source),warnings=[];if(/sqrt\s*\(/i.test(s))warnings.push('sqrt is defined only when its input is nonnegative.');if(/(?:log|ln|log2|log10)\s*\(/i.test(s))warnings.push('Logarithms require a positive input.');if(/\/(?!\/)/.test(s))warnings.push('Division may create singularities where the denominator is zero.');if(/(?:tan|sec)\s*\(/i.test(s))warnings.push('tan/sec have periodic singularities.');return warnings;}
export const FUNCTION_DATABASE=Object.freeze(Object.keys(FUNCTIONS));
export const FUNCTION_HELP=Object.freeze({arctan:'arctan(x) or arctan(y,x) — inverse tangent',piecewise:'piecewise(condition, trueValue, falseValue)',between:'between(x,a,b) — 1 inside [a,b]',lt:'lt(a,b) — 1 when a<b',root:'root(x,n) — real nth root',hypot:'hypot(a,b,...) — Euclidean length',clamp:'clamp(x,min,max)',smoothstep:'smoothstep(min,max,x) — smooth transition'});
