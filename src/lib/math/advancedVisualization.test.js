import {describe,expect,it} from 'vitest';
import {circleIntegrals,polylineIntegrals} from './lineIntegrals.js';
import {lineIntegralConvolution} from './lic.js';
import {traceBothDirections} from './streamlines.js';
import {classifyBasins} from './basins.js';
import {placeStreamlines} from './streamlinePlacement.js';

describe('advanced vector analysis',()=>{
  it('measures circulation and flux around a circle',()=>{const vortex={evaluate:(x,y)=>[-y,x]},source={evaluate:(x,y)=>[x,y]},a=circleIntegrals(vortex,0,0,2,256),b=circleIntegrals(source,0,0,2,256);expect(a.circulation).toBeCloseTo(8*Math.PI,2);expect(a.flux).toBeCloseTo(0,5);expect(b.flux).toBeCloseTo(8*Math.PI,2);});
  it('measures circulation and flux along a drawn polygon',()=>{const square=[[-1,-1],[1,-1],[1,1],[-1,1]],vortex={evaluate:(x,y)=>[-y,x]},source={evaluate:(x,y)=>[x,y]};expect(polylineIntegrals(vortex,square,{closed:true}).circulation).toBeCloseTo(8,5);expect(polylineIntegrals(source,square,{closed:true}).flux).toBeCloseTo(8,5);});
  it('traces a bounded adaptive streamline',()=>{const field={evaluate:(x,y)=>[-y,x]},bounds={minX:-2,maxX:2,minY:-2,maxY:2},line=traceBothDirections(field,{x:1,y:0},bounds);expect(line.length).toBeGreaterThan(100);expect(line.every(p=>p.every(Number.isFinite))).toBe(true);});
  it('places finite, separated streamlines',()=>{const field={evaluate:(x,y)=>[-y,x]},bounds={minX:-2,maxX:2,minY:-2,maxY:2},lines=placeStreamlines(field,bounds,{density:10,maxLines:12});expect(lines.length).toBeGreaterThan(1);expect(lines.length).toBeLessThanOrEqual(12);expect(lines.flat().every(p=>p.every(Number.isFinite))).toBe(true);});
  it('classifies points attracted to a sink',()=>{const field={evaluate:(x,y)=>[-x,-y]},bounds={minX:-1,maxX:1,minY:-1,maxY:1},result=classifyBasins(field,bounds,[{x:0,y:0}],12,10);expect(result.labels.filter(x=>x===0).length).toBeGreaterThan(90);});
  it('produces finite deterministic LIC samples',()=>{const grid={cols:3,rows:2,fx:new Float32Array(12).fill(1),fy:new Float32Array(12)},a=lineIntegralConvolution(grid,4),b=lineIntegralConvolution(grid,4);expect(a).toBe(b);expect([...a].every(Number.isFinite)).toBe(true);});
});
