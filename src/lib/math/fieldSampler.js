const cache=new WeakMap();

export function sampleField(field,bounds,cols=128,rows=Math.max(32,Math.round(cols*.65))){
  const key=[bounds.minX,bounds.maxX,bounds.minY,bounds.maxY,cols,rows].join('|'),previous=cache.get(field);
  if(previous?.key===key)return previous.grid;
  const size=(cols+1)*(rows+1),fx=new Float32Array(size),fy=new Float32Array(size),magnitude=new Float32Array(size),potential=field.scalar?new Float32Array(size):null;
  let minMagnitude=Infinity,maxMagnitude=-Infinity;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const k=j*(cols+1)+i,x=bounds.minX+i/cols*(bounds.maxX-bounds.minX),y=bounds.minY+j/rows*(bounds.maxY-bounds.minY),v=field.evaluate(x,y),vx=Number(v[0]),vy=Number(v[1]),m=Math.hypot(vx,vy);
    fx[k]=vx;fy[k]=vy;magnitude[k]=m;if(potential)potential[k]=field.scalar(x,y);if(Number.isFinite(m)){minMagnitude=Math.min(minMagnitude,m);maxMagnitude=Math.max(maxMagnitude,m);}
  }
  const divergence=new Float32Array(size),curl=new Float32Array(size),dx=(bounds.maxX-bounds.minX)/cols,dy=(bounds.maxY-bounds.minY)/rows;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const k=j*(cols+1)+i,il=Math.max(0,i-1),ir=Math.min(cols,i+1),jb=Math.max(0,j-1),jt=Math.min(rows,j+1),sx=(ir-il)*dx,sy=(jt-jb)*dy;
    divergence[k]=(fx[j*(cols+1)+ir]-fx[j*(cols+1)+il])/sx+(fy[jt*(cols+1)+i]-fy[jb*(cols+1)+i])/sy;
    curl[k]=(fy[j*(cols+1)+ir]-fy[j*(cols+1)+il])/sx-(fx[jt*(cols+1)+i]-fx[jb*(cols+1)+i])/sy;
  }
  const grid={bounds:{...bounds},cols,rows,fx,fy,magnitude,potential,divergence,curl,minMagnitude,maxMagnitude,get(quantity){return quantity==='potential'&&potential?potential:this[quantity]||magnitude;}};
  cache.set(field,{key,grid});return grid;
}

export function finiteRange(values,low=.02,high=.98){const sorted=Array.from(values).filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return[0,1];return[sorted[Math.min(sorted.length-1,Math.floor(sorted.length*low))],sorted[Math.max(0,Math.ceil(sorted.length*high)-1)]];}

export function clearFieldSample(field){cache.delete(field);}
