import { describe,expect,it } from 'vitest';
import { compileExpression,compileGradientField,compileVectorField,parseExpression,parseParameters } from './expression';
describe('math expressions',()=>{
  it('respects precedence and exponentiation',()=>{const f=compileExpression('2*x^2 + sin(y)');expect(f.evaluate(3,0)).toBe(18);expect(f.glsl).toContain('pow(x, 2.0)');});
  it('accepts Desmos-style implicit multiplication',()=>{expect(compileExpression('2x + 3sin(y)').evaluate(4,Math.PI/2)).toBe(11);expect(compileExpression('(x+1)(y-1)').evaluate(2,3)).toBe(6);});
  it('supports named parameters',()=>{const field=compileVectorField('a*y','-a*x',{a:2});expect(field.evaluate(3,4)).toEqual([8,-6]);expect(field.code).toContain('2.0');});
  it('parses parameter lists',()=>expect(parseParameters('a=2, b=-.5')).toEqual({a:2,b:-.5}));
  it('creates gradients from scalar expressions',()=>expect(compileGradientField('x^2+y^2').evaluate(2,3)).toEqual(expect.arrayContaining([expect.closeTo(4,4),expect.closeTo(6,4)])));
  it('rejects unknown symbols and statements',()=>{expect(()=>compileExpression('secret+x')).toThrow('Unknown symbol');expect(()=>parseExpression('x; y')).toThrow();});
  it('matches GLSL two-argument atan semantics',()=>expect(compileExpression('atan(y,x)').evaluate(0,-1)).toBeCloseTo(-Math.PI/2));
});
