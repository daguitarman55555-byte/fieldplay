const FUNCTIONS = new Set(['sin','cos','tan','asin','acos','atan','abs','sqrt','exp','log','floor','ceil','min','max','pow']);
const CONSTANTS = { pi: Math.PI, e: Math.E };

export function parseExpression(source) {
  const tokens=tokenize(source); let cursor=0;
  const peek=()=>tokens[cursor]; const take=()=>tokens[cursor++];
  function expression(min=0){
    let left=prefix();
    while(peek() && peek().type==='op' && precedence(peek().value)>=min){
      const op=take().value, priority=precedence(op);
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
        if(!FUNCTIONS.has(token.value)) throw syntax(`Unknown function: ${token.value}`);
        take(); const args=[]; if(peek()?.value!==')'){do{args.push(expression());if(peek()?.value!==',')break;take();}while(true);}
        expect('paren',')'); return {type:'call',name:token.value,args};
      }
      return {type:'name',name:token.value};
    }
    throw syntax(`Unexpected token: ${token.value}`);
  }
  function expect(type,value){const token=take();if(!token||token.type!==type||token.value!==value)throw syntax(`Expected ${value}`);}
  const ast=expression(); if(peek()) throw syntax(`Unexpected token: ${peek().value}`); return ast;
}

export function compileExpression(source, parameters = {}) {
  const ast=parseExpression(source);
  const names=collectNames(ast);
  names.forEach(name=>{if(name!=='x'&&name!=='y'&&!(name in CONSTANTS)&&!(name in parameters))throw syntax(`Unknown symbol: ${name}`);});
  return {
    ast,
    glsl: toGLSL(ast,parameters),
    evaluate(x,y){return evaluate(ast,{x,y,...CONSTANTS,...parameters});}
  };
}

export function compileVectorField(xSource,ySource,parameters={}){
  const x=compileExpression(xSource,parameters),y=compileExpression(ySource,parameters);
  return {
    code:`vec2 get_velocity(vec2 p) {\n  float x = p.x;\n  float y = p.y;\n  return vec2(${x.glsl}, ${y.glsl});\n}`,
    evaluate(px,py){return [x.evaluate(px,py),y.evaluate(px,py)];},
    expressions:{x:String(xSource),y:String(ySource)},parameters:{...parameters}
  };
}

export function compileGradientField(source,parameters={},epsilon=.001){
  const scalar=compileExpression(source,parameters),e=Math.min(.1,Math.max(.000001,Number(epsilon)||.001));
  return {
    code:`float studio_scalar(vec2 p) {\n  float x = p.x;\n  float y = p.y;\n  return ${scalar.glsl};\n}\nvec2 get_velocity(vec2 p) {\n  float e = ${glslNumber(e)};\n  return vec2(studio_scalar(p+vec2(e,0.0))-studio_scalar(p-vec2(e,0.0)), studio_scalar(p+vec2(0.0,e))-studio_scalar(p-vec2(0.0,e))) / (2.0*e);\n}`,
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
  if(ast.type==='name'){if(ast.name==='pi')return '3.141592653589793';if(ast.name==='e')return '2.718281828459045';if(ast.name in parameters)return glslNumber(parameters[ast.name]);return ast.name;}
  if(ast.type==='unary')return `(${ast.op}${toGLSL(ast.value,parameters)})`;
  if(ast.type==='binary'){const l=toGLSL(ast.left,parameters),r=toGLSL(ast.right,parameters);return ast.op==='^'?`pow(${l}, ${r})`:`(${l} ${ast.op} ${r})`;}
  return `${ast.name}(${ast.args.map(x=>toGLSL(x,parameters)).join(', ')})`;
}
function evaluate(ast,scope){
  if(ast.type==='number')return ast.value;if(ast.type==='name')return scope[ast.name];if(ast.type==='unary')return ast.op==='-'?-evaluate(ast.value,scope):evaluate(ast.value,scope);
  if(ast.type==='binary'){const a=evaluate(ast.left,scope),b=evaluate(ast.right,scope);return ast.op==='+'?a+b:ast.op==='-'?a-b:ast.op==='*'?a*b:ast.op==='/'?a/b:a**b;}
  const args=ast.args.map(x=>evaluate(x,scope)); if(ast.name==='atan'&&args.length===2)return Math.atan2(args[0],args[1]);return Math[ast.name](...args);
}
function glslNumber(value){const n=Number(value);return Number.isInteger(n)?n.toFixed(1):String(n);}
function syntax(message){return new Error(message);}
