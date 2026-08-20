export function analyzePoint(field,x,y,h=1e-4){
  const [fx,fy]=field(x,y),[xp0,xp1]=field(x+h,y),[xm0,xm1]=field(x-h,y),[yp0,yp1]=field(x,y+h),[ym0,ym1]=field(x,y-h);
  const a=(xp0-xm0)/(2*h),b=(yp0-ym0)/(2*h),c=(xp1-xm1)/(2*h),d=(yp1-ym1)/(2*h);
  const trace=a+d,det=a*d-b*c,disc=trace*trace-4*det;
  return {vector:[fx,fy],jacobian:[[a,b],[c,d]],divergence:trace,curl:c-b,determinant:det,classification:classify(trace,det,disc)};
}
export function findCriticalPoints(field,bounds,{grid=28,tolerance=.035,max=24}={}){
  const found=[]; const dx=(bounds.maxX-bounds.minX)/grid,dy=(bounds.maxY-bounds.minY)/grid;
  for(let iy=0;iy<=grid;iy++)for(let ix=0;ix<=grid;ix++){
    let x=bounds.minX+ix*dx,y=bounds.minY+iy*dy; const v=field(x,y); if(!finite(v)||Math.hypot(...v)>tolerance*Math.max(dx,dy))continue;
    for(let k=0;k<8;k++){const q=analyzePoint(field,x,y),[[a,b],[c,d]]=q.jacobian,det=a*d-b*c;if(Math.abs(det)<1e-10)break;const [u,w]=q.vector;x-=(d*u-b*w)/det;y-=(-c*u+a*w)/det;}
    const v2=field(x,y); if(!finite(v2)||Math.hypot(...v2)>tolerance||x<bounds.minX||x>bounds.maxX||y<bounds.minY||y>bounds.maxY)continue;
    if(found.some(p=>Math.hypot(p.x-x,p.y-y)<Math.min(dx,dy)*.35))continue;
    found.push({x,y,...analyzePoint(field,x,y)});if(found.length>=max)return found;
  } return found;
}
function classify(trace,det,disc){if(det<0)return 'saddle';if(det>0&&disc<0)return Math.abs(trace)<1e-5?'center':trace<0?'spiral sink':'spiral source';if(det>0)return trace<0?'sink':'source';return 'degenerate';}
function finite(v){return Array.isArray(v)&&v.every(Number.isFinite);}
