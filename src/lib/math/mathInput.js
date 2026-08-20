const FUNCTION_NAMES=['arcsinh','arccosh','arctanh','smoothstep','piecewise','between','arcsin','arccos','arctan','degrees','radians','log10','atan2','asinh','acosh','atanh','sinh','cosh','tanh','sqrt','cbrt','floor','ceil','round','trunc','fract','hypot','clamp','select','log2','logb','exp2','asin','acos','atan','sin','cos','tan','sec','csc','cot','abs','exp','log','ln','min','max','pow','mod','mix','lerp','step','sign','root','lte','gte','lt','gt','eq'];

export function normalizeMathInput(value){
  let text=String(value||'').replace(/\u2212/g,'-').replace(/[×·]/g,'*');
  for(const name of FUNCTION_NAMES){
    const spaced=name.split('').join('\\s*');
    text=text.replace(new RegExp(`\\b${spaced}\\s*(?=\\()`,'gi'),name);
  }
  return text.replace(/\bpi\b/gi,'pi')
    .replace(/\s*([+\-*/^(),])\s*/g,'$1')
    .trim().replace(/\s+/g,'*');
}

export function expressionToLatex(value){
  const native=new Set(['sin','cos','tan','sec','csc','cot','sinh','cosh','tanh','arcsin','arccos','arctan','sqrt','exp','log','ln','min','max']);
  return String(value||'').replace(new RegExp(`\\b(${FUNCTION_NAMES.join('|')})\\b`,'g'),name=>native.has(name)?`\\${name}`:`\\operatorname{${name}}`).replace(/\*/g,'\\cdot ');
}
