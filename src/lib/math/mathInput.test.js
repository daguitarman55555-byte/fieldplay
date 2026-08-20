import {describe,expect,it} from 'vitest';
import {expressionToLatex,normalizeMathInput} from './mathInput.js';
describe('visual math input',()=>{
  it('preserves spaced implicit multiplication',()=>expect(normalizeMathInput('x y cos(x)')).toBe('x*y*cos(x)'));
  it('does not multiply around operators',()=>expect(normalizeMathInput('2 x + 3 sin(y)')).toBe('2*x+3*sin(y)'));
  it('rejoins MathLive operator names without merging variables',()=>expect(normalizeMathInput('s i n (x) + a r c t a n (x y)')).toBe('sin(x)+arctan(x*y)'));
  it('uses MathLive native inverse-trig commands',()=>expect(expressionToLatex('arctan(x)')).toBe('\\arctan(x)'));
});
