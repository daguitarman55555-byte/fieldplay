import{describe,expect,it}from'vitest';import{differentiateExpression,integrateExpression,simplifyExpression,solvePolynomial,toLatex}from'./symbolic.js';

describe('symbolic mathematics',()=>{
  it('simplifies arithmetic identities',()=>{expect(simplifyExpression('0+x*1')).toBe('x');expect(simplifyExpression('(2+3)*x')).toBe('(5*x)');});
  it('differentiates products, powers and chains',()=>{expect(differentiateExpression('x^3','x')).toBe('(3*(x^2))');expect(differentiateExpression('sin(x^2)','x')).toContain('cos((x^2))');expect(differentiateExpression('x^4','x',2)).toContain('(x^2)');});
  it('computes partial derivatives',()=>expect(differentiateExpression('x^2*y+y^3','y')).toContain('(x^2)'));
  it('finds elementary antiderivatives',()=>{expect(integrateExpression('x^2','x')).toBe('((x^3)/3)');expect(integrateExpression('sin(x)','x')).toBe('-cos(x)');});
  it('solves linear and quadratic polynomials',()=>{expect(solvePolynomial('2*x+4=0','x')).toEqual([-2]);expect(solvePolynomial('x^2-5*x+6=0','x')).toEqual([2,3]);expect(solvePolynomial('x^2+1=0','x')).toEqual([]);});
  it('emits MathQuill-compatible latex',()=>expect(toLatex(differentiateExpression('x^3','x'))).toContain('^{2}'));
});
