import {describe,expect,it} from 'vitest';
import {finiteRange,sampleField} from './fieldSampler.js';
describe('sampled field cache',()=>{
  it('shares samples and derives magnitude, divergence and curl',()=>{const field={evaluate:(x,y)=>[2*x-y,x+3*y]},b={minX:-1,maxX:1,minY:-1,maxY:1},a=sampleField(field,b,20,20),c=sampleField(field,b,20,20);expect(c).toBe(a);const k=10*21+10;expect(a.magnitude[k]).toBeCloseTo(0);expect(a.divergence[k]).toBeCloseTo(5,4);expect(a.curl[k]).toBeCloseTo(2,4);});
  it('uses robust percentile ranges',()=>expect(finiteRange([0,1,2,3,100],.2,.8)).toEqual([1,3]));
});
