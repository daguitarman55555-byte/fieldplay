import {describe,expect,it} from 'vitest';
import {derivedScalar} from './fieldQuantities.js';
const bounds={minX:-2,maxX:2,minY:-2,maxY:2};
describe('vector field scalar quantities',()=>{
  const field={evaluate:(x,y)=>[2*x,-3*y]};
  it('computes magnitude for every vector field',()=>expect(derivedScalar(field,'magnitude',bounds)(3,4)).toBeCloseTo(Math.hypot(6,-12)));
  it('computes divergence numerically',()=>expect(derivedScalar(field,'divergence',bounds)(.4,.7)).toBeCloseTo(-1,5));
  it('computes curl numerically',()=>expect(derivedScalar({evaluate:(x,y)=>[-y,x]},'curl',bounds)(.4,.7)).toBeCloseTo(2,5));
  it('uses a potential when available',()=>expect(derivedScalar({...field,scalar:(x,y)=>x*y},'potential',bounds)(3,4)).toBe(12));
});
