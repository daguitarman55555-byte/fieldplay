export function normalizeMathInput(value){
  return String(value||'').replace(/\u2212/g,'-').replace(/\bpi\b/gi,'pi')
    .replace(/\s*([+\-*/^(),])\s*/g,'$1')
    .trim().replace(/\s+/g,'*');
}

export function expressionToLatex(value){
  return String(value||'').replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|abs|exp|log|floor|ceil|min|max)\b/g,'\\$1').replace(/\*/g,'\\cdot ');
}
