import {describe,expect,it} from 'vitest';
import {robustColorRange} from './colorRange.js';
describe('robustColorRange',()=>{
  it('ignores invalid values and singular outliers',()=>{const values=[NaN,Infinity,-1,...Array.from({length:100},(_,i)=>i/10),1e12];const[lo,hi]=robustColorRange(values);expect(lo).toBeCloseTo(.2);expect(hi).toBeCloseTo(9.8);});
  it('has a useful range for a constant or empty field',()=>{expect(robustColorRange([])).toEqual([0,1]);expect(robustColorRange([0,0])).toEqual([0,1]);});
});
