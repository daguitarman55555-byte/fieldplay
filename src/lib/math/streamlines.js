export function traceStreamline(field,start,bounds,{direction=1,tolerance=1e-4,maxSteps=1200}={}){
  const out=[[start.x,start.y]],span=Math.min(bounds.maxX-bounds.minX,bounds.maxY-bounds.minY),base=span/360,minStep=base/16,maxStep=base*4;
  let x=start.x,y=start.y,h=base;
  for(let i=0;i<maxSteps;i++){
    const full=rk4(field,x,y,h,direction),half1=rk4(field,x,y,h/2,direction);if(!full||!half1)break;
    const half2=rk4(field,half1[0],half1[1],h/2,direction);if(!half2)break;
    const error=Math.hypot(full[0]-half2[0],full[1]-half2[1]),scale=Math.max(1,Math.hypot(x,y));
    if(error>tolerance*scale&&h>minStep){h=Math.max(minStep,h*.5);continue;}
    x=half2[0];y=half2[1];out.push([x,y]);
    if(error<tolerance*scale*.08)h=Math.min(maxStep,h*1.6);
    if(x<bounds.minX||x>bounds.maxX||y<bounds.minY||y>bounds.maxY)break;
    if(i>30&&Math.hypot(x-start.x,y-start.y)<h*.7)break;
  }
  return out;
}
export function traceBothDirections(field,start,bounds,options={}){const a=traceStreamline(field,start,bounds,{...options,direction:-1}).reverse(),b=traceStreamline(field,start,bounds,{...options,direction:1});return a.slice(0,-1).concat(b);}
function rk4(field,x,y,h,direction){const unit=(px,py)=>{const v=field.evaluate(px,py),m=Math.hypot(...v);return Number.isFinite(m)&&m>1e-12?[direction*v[0]/m,direction*v[1]/m]:null;},a=unit(x,y);if(!a)return null;const b=unit(x+a[0]*h/2,y+a[1]*h/2);if(!b)return null;const c=unit(x+b[0]*h/2,y+b[1]*h/2);if(!c)return null;const d=unit(x+c[0]*h,y+c[1]*h);if(!d)return null;return[x+h*(a[0]+2*b[0]+2*c[0]+d[0])/6,y+h*(a[1]+2*b[1]+2*c[1]+d[1])/6];}
