import { describe,expect,it } from 'vitest';
import { compileExpression,compileGradientField,compileVectorField,parseExpression,parseParameters } from './expression';
describe('math expressions',()=>{
  it('respects precedence and exponentiation',()=>{const f=compileExpression('2*x^2 + sin(y)');expect(f.evaluate(3,0)).toBe(18);expect(f.glsl).toContain('pow(x, 2.0)');});
  it('supports named parameters',()=>{const field=compileVectorField('a*y','-a*x',{a:2});expect(field.evaluate(3,4)).toEqual([8,-6]);expect(field.code).toContain('2.0');});
  it('parses parameter lists',()=>expect(parseParameters('a=2, b=-.5')).toEqual({a:2,b:-.5}));
  it('creates gradients from scalar expressions',()=>expect(compileGradientField('x^2+y^2').evaluate(2,3)).toEqual(expect.arrayContaining([expect.closeTo(4,4),expect.closeTo(6,4)])));
  it('rejects unknown symbols and statements',()=>{expect(()=>compileExpression('secret+x')).toThrow('Unknown symbol');expect(()=>parseExpression('x; y')).toThrow();});
});
