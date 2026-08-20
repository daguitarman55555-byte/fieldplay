import {describe,expect,it} from 'vitest';
import {circleIntegrals} from './lineIntegrals.js';
import {lineIntegralConvolution} from './lic.js';
import {traceBothDirections} from './streamlines.js';

describe('advanced vector analysis',()=>{
  it('measures circulation and flux around a circle',()=>{const vortex={evaluate:(x,y)=>[-y,x]},source={evaluate:(x,y)=>[x,y]},a=circleIntegrals(vortex,0,0,2,256),b=circleIntegrals(source,0,0,2,256);expect(a.circulation).toBeCloseTo(8*Math.PI,2);expect(a.flux).toBeCloseTo(0,5);expect(b.flux).toBeCloseTo(8*Math.PI,2);});
  it('traces a bounded adaptive streamline',()=>{const field={evaluate:(x,y)=>[-y,x]},bounds={minX:-2,maxX:2,minY:-2,maxY:2},line=traceBothDirections(field,{x:1,y:0},bounds);expect(line.length).toBeGreaterThan(100);expect(line.every(p=>p.every(Number.isFinite))).toBe(true);});
  it('produces finite deterministic LIC samples',()=>{const grid={cols:3,rows:2,fx:new Float32Array(12).fill(1),fy:new Float32Array(12)},a=lineIntegralConvolution(grid,4),b=lineIntegralConvolution(grid,4);expect(a).toBe(b);expect([...a].every(Number.isFinite)).toBe(true);});
});
