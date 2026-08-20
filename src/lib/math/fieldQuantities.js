export function derivedScalar(field,quantity,bounds){
  const ex=Math.max(1e-6,(bounds.maxX-bounds.minX)*1e-4),ey=Math.max(1e-6,(bounds.maxY-bounds.minY)*1e-4);
  if(quantity==='potential'&&field.scalar)return field.scalar;
  if(quantity==='divergence')return(x,y)=>(field.evaluate(x+ex,y)[0]-field.evaluate(x-ex,y)[0])/(2*ex)+(field.evaluate(x,y+ey)[1]-field.evaluate(x,y-ey)[1])/(2*ey);
  if(quantity==='curl')return(x,y)=>(field.evaluate(x+ex,y)[1]-field.evaluate(x-ex,y)[1])/(2*ex)-(field.evaluate(x,y+ey)[0]-field.evaluate(x,y-ey)[0])/(2*ey);
  return(x,y)=>Math.hypot(...field.evaluate(x,y));
}
