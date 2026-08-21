import {describe,expect,it} from 'vitest';
import {compileVectorField} from './math/expression.js';
import {generateRandomField} from './randomFieldGenerator.js';

describe('random field generator',()=>{
  it('produces at least 100 distinct, compilable fields',()=>{
    const random=lcg(123456),signatures=new Set();
    for(let i=0;i<200;i++){
      const generated=generateRandomField(random),model=compileVectorField(generated.x,generated.y);
      signatures.add(generated.signature);
      for(const[x,y]of[[-2,-1],[0,0],[1.5,2.5]])expect(model.evaluate(x,y).every(Number.isFinite)).toBe(true);
    }
    expect(signatures.size).toBeGreaterThanOrEqual(100);
  });
  it('recreates a field from the same seed source',()=>expect(generateRandomField(()=>.314159)).toEqual(generateRandomField(()=>.314159)));
});

function lcg(seed){let state=seed>>>0;return()=>((state=Math.imul(1664525,state)+1013904223>>>0)/4294967296);}
