import {describe,expect,it} from 'vitest';
import {normalizeMathInput} from './mathInput.js';
describe('visual math input',()=>{
  it('preserves spaced implicit multiplication',()=>expect(normalizeMathInput('x y cos(x)')).toBe('x*y*cos(x)'));
  it('does not multiply around operators',()=>expect(normalizeMathInput('2 x + 3 sin(y)')).toBe('2*x+3*sin(y)'));
});
