import {describe,expect,it} from 'vitest';
import {arrowSegment,contourSegments,createViewportTransform} from './overlayGeometry.js';

describe('overlay geometry',()=>{
  const transform=createViewportTransform({minX:-2,maxX:2,minY:-1,maxY:1},{left:-20,top:-10,width:440,height:220});
  it('uses the real padded canvas rectangle',()=>expect(transform.point(0,0)).toEqual([200,100]));
  it('points right for (1, 0)',()=>{const arrow=arrowSegment(transform,0,0,1,0,20);expect(arrow.x2).toBeGreaterThan(arrow.x1);expect(arrow.y2).toBeCloseTo(arrow.y1);});
  it('points upward for (0, 1)',()=>{const arrow=arrowSegment(transform,0,0,0,1,20);expect(arrow.y2).toBeLessThan(arrow.y1);});
  it('creates a contour segment',()=>expect(contourSegments([-1,1,-1,1],1,1,0,100,100)).toEqual([[[50,0],[50,100]]]));
});
