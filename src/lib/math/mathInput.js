export function normalizeMathInput(value){
  return String(value||'').replace(/\u2212/g,'-').replace(/\bpi\b/gi,'pi')
    .replace(/\s*([+\-*/^(),])\s*/g,'$1')
    .trim().replace(/\s+/g,'*');
}

export function expressionToLatex(value){
  const functions='arcsinh|arccosh|arctanh|smoothstep|arcsin|arccos|arctan|degrees|radians|log10|atan2|asinh|acosh|atanh|sinh|cosh|tanh|sqrt|cbrt|floor|ceil|round|trunc|fract|hypot|clamp|log2|logb|exp2|asin|acos|atan|sin|cos|tan|sec|csc|cot|abs|exp|log|ln|min|max|pow|mod|mix|lerp|step|sign|root';
  return String(value||'').replace(new RegExp(`\\b(${functions})\\b`,'g'),name=>`\\operatorname{${name}}`).replace(/\*/g,'\\cdot ');
}
