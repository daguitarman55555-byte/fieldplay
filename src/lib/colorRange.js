export function robustColorRange(values,lower=.02,upper=.98){
  const finite=[];
  for(const value of values){const n=Number(value);if(Number.isFinite(n)&&n>=0)finite.push(n);}
  if(!finite.length)return[0,1];
  finite.sort((a,b)=>a-b);
  const sample=q=>finite[Math.min(finite.length-1,Math.max(0,Math.round((finite.length-1)*q)))];
  let lo=sample(lower),hi=sample(upper);
  if(!(hi>lo)){lo=0;hi=Math.max(1,finite.at(-1));}
  return[lo,hi];
}
