import {describe,expect,it} from 'vitest';import{analyzePoint,findCriticalPoints}from'./fieldAnalysis';
describe('field analysis',()=>{
  it('classifies a saddle',()=>expect(analyzePoint((x,y)=>[x,-y],0,0).classification).toBe('saddle'));
  it('computes divergence and curl',()=>{const q=analyzePoint((x,y)=>[-y,x],0,0);expect(q.divergence).toBeCloseTo(0);expect(q.curl).toBeCloseTo(2);});
  it('finds isolated critical points',()=>{const points=findCriticalPoints((x,y)=>[x,-y],{minX:-2,maxX:2,minY:-2,maxY:2});expect(points).toHaveLength(1);expect(points[0].x).toBeCloseTo(0);});
});
