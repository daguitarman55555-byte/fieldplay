const cache=new WeakMap();
export function lineIntegralConvolution(grid,steps=10){
  const old=cache.get(grid);if(old?.steps===steps)return old.values;
  const w=grid.cols+1,h=grid.rows+1,noise=new Float32Array(w*h),out=new Float32Array(w*h);
  for(let i=0;i<noise.length;i++)noise[i]=hash(i);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=noise[y*w+x],count=1;for(const sign of[-1,1]){let px=x,py=y;for(let s=0;s<steps;s++){const ix=Math.max(0,Math.min(w-1,Math.round(px))),iy=Math.max(0,Math.min(h-1,Math.round(py))),k=iy*w+ix,m=Math.hypot(grid.fx[k],grid.fy[k]);if(!Number.isFinite(m)||m<1e-10)break;px+=sign*grid.fx[k]/m;py+=sign*grid.fy[k]/m;if(px<0||px>=w||py<0||py>=h)break;const sx=Math.max(0,Math.min(w-1,Math.round(px))),sy=Math.max(0,Math.min(h-1,Math.round(py)));sum+=noise[sy*w+sx];count++;}}out[y*w+x]=sum/count;}
  cache.set(grid,{steps,values:out});return out;
}
function hash(i){let x=(i+1)*2654435761;x=(x^(x>>>15))*2246822519;return((x^(x>>>13))>>>0)/4294967295;}
