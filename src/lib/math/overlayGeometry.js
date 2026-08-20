export function createViewportTransform(bbox, canvasRect) {
  const width=canvasRect.width, height=canvasRect.height;
  const sx=width/(bbox.maxX-bbox.minX), sy=height/(bbox.maxY-bbox.minY);
  return {
    point(x,y){return [canvasRect.left+(x-bbox.minX)*sx,canvasRect.top+(bbox.maxY-y)*sy];},
    vector(vx,vy){return [vx*sx,-vy*sy];}
  };
}

export function arrowSegment(transform,x,y,vx,vy,length) {
  const [px,py]=transform.point(x,y),[rawX,rawY]=transform.vector(vx,vy);
  const magnitude=Math.hypot(rawX,rawY);
  if(!Number.isFinite(magnitude)||magnitude<1e-12)return null;
  const dx=rawX/magnitude*length,dy=rawY/magnitude*length;
  return {x1:px-dx*.22,y1:py-dy*.22,x2:px+dx*.78,y2:py+dy*.78,angle:Math.atan2(dy,dx)};
}

export function contourSegments(values,cols,rows,level,width,height) {
  const segments=[],cw=width/cols,ch=height/rows;
  const edge=(edgeIndex,i,j,a,b,c,d)=>{
    const lerp=(v1,v2)=>Math.max(0,Math.min(1,(level-v1)/(v2-v1||1e-12)));
    if(edgeIndex===0)return[(i+lerp(a,b))*cw,j*ch];
    if(edgeIndex===1)return[(i+1)*cw,(j+lerp(b,d))*ch];
    if(edgeIndex===2)return[(i+lerp(c,d))*cw,(j+1)*ch];
    return[i*cw,(j+lerp(a,c))*ch];
  };
  const table={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[3,2]],5:[[0,2]],6:[[0,1],[3,2]],7:[[2,1]],8:[[1,2]],9:[[0,3],[1,2]],10:[[0,2]],11:[[3,2]],12:[[1,3]],13:[[0,1]],14:[[3,0]]};
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const k=j*(cols+1)+i,a=values[k],b=values[k+1],c=values[k+cols+1],d=values[k+cols+2];
    if(![a,b,c,d].every(Number.isFinite))continue;
    const mask=(a>=level?1:0)|(b>=level?2:0)|(c>=level?4:0)|(d>=level?8:0);
    (table[mask]||[]).forEach(([e1,e2])=>segments.push([edge(e1,i,j,a,b,c,d),edge(e2,i,j,a,b,c,d)]));
  }
  return segments;
}
