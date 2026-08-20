import {describe,expect,it} from 'vitest';
import {extractContourPaths,smoothContourPath} from './smoothContours.js';
describe('smooth contours',()=>{
  it('joins marching-square segments into paths',()=>{const values=[];for(let j=0;j<=4;j++)for(let i=0;i<=4;i++)values.push(i-2);const paths=extractContourPaths(values,4,4,0,100,100);expect(paths).toHaveLength(1);expect(paths[0].length).toBe(5);});
  it('resolves ambiguous cells into two paths',()=>expect(extractContourPaths([1,-1,-1,1],1,1,0,10,10)).toHaveLength(2));
  it('smooths paths without moving endpoints',()=>{const p=[[0,0],[1,1],[2,0],[3,1]],s=smoothContourPath(p,1);expect(s[0]).toEqual(p[0]);expect(s[s.length-1]).toEqual(p[p.length-1]);expect(s.length).toBeGreaterThan(p.length);});
});
