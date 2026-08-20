const cache=new WeakMap();
export function classifyBasins(field,bounds,attractors,cols=72,rows=Math.max(36,Math.round(cols*.65))){
  const key=[bounds.minX,bounds.maxX,bounds.minY,bounds.maxY,cols,rows,attractors.map(p=>`${p.x},${p.y}`).join(';')].join('|'),old=cache.get(field);if(old?.key===key)return old.result;
  const labels=new Int16Array(cols*rows).fill(-1),span=Math.min(bounds.maxX-bounds.minX,bounds.maxY-bounds.minY),step=span/110,near=span/45;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let x=bounds.minX+(i+.5)/cols*(bounds.maxX-bounds.minX),y=bounds.minY+(j+.5)/rows*(bounds.maxY-bounds.minY);for(let n=0;n<320;n++){const hit=attractors.findIndex(a=>Math.hypot(x-a.x,y-a.y)<near);if(hit>=0){labels[j*cols+i]=hit;break;}const v=field.evaluate(x,y),m=Math.hypot(...v);if(!Number.isFinite(m)||m<1e-12)break;x+=v[0]/m*step;y+=v[1]/m*step;if(x<bounds.minX||x>bounds.maxX||y<bounds.minY||y>bounds.maxY)break;}}
  const result={labels,cols,rows,attractors};cache.set(field,{key,result});return result;
}
