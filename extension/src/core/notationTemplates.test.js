import{describe,expect,it}from'vitest';import{notationTemplate,toggleIntegralBounds}from'./notationTemplates.js';
describe('natural calculus notation templates',()=>{
  it('adds editable ordinary derivative arguments',()=>{expect(notationTemplate('\\frac{d}{dx}')).toEqual({latex:'\\frac{d}{dx}\\left(\\right)',left:1});expect(notationTemplate('\\frac{d^{3}}{dz^{3}}').latex).toContain('d^{3}');});
  it('turns pd shorthand into partial notation',()=>expect(notationTemplate('\\frac{pd}{pdy}').latex).toBe('\\frac{\\partial}{\\partial y}\\left(\\right)'));
  it('completes an already progressively formatted partial',()=>expect(notationTemplate('\\frac{\\partial}{\\partial x}').latex).toBe('\\frac{\\partial}{\\partial x}\\left(\\right)'));
  it('completes a partial after pd has already become the symbol',()=>expect(notationTemplate('\\frac{\\partial}{pdx}').latex).toBe('\\frac{\\partial}{\\partial x}\\left(\\right)'));
  it('formats mixed higher partials',()=>expect(notationTemplate('\\frac{pd^{2}T}{pdxpdy}').latex).toBe('\\frac{\\partial^{2}T}{\\partial x\\partial y}'));
  it('creates indefinite and bounded integral structures',()=>{expect(notationTemplate('int').latex).toBe('\\int\\left(\\right)\\,dx');expect(notationTemplate('intb').latex).toContain('\\int_{ }^{ }');expect(notationTemplate('tripleint').latex).toContain('\\iiint');});
  it('formats vector-calculus operators',()=>{expect(notationTemplate('grad').latex).toBe('\\nabla\\left(\\right)');expect(notationTemplate('div').latex).toContain('\\nabla\\cdot');});
  it('creates a 2 by 2 editable matrix from mtx',()=>expect(notationTemplate('mtx')).toMatchObject({matrix:true,left:3}));
  it('creates Jacobian and Hessian command templates',()=>{expect(notationTemplate('jacobian').latex).toContain('\\operatorname{jacobian}');expect(notationTemplate('hessian').latex).toContain('x,y');});
  it('leaves a derivative with an existing target alone',()=>expect(notationTemplate('\\frac{d^{3}T}{dz^{3}}')).toBeNull());
  it('adds and removes bounds without changing the integral body',()=>{const plain='\\int\\left(x^2\\right)\\,dx',bounded=toggleIntegralBounds(plain,true);expect(bounded).toBe('\\int_{ }^{ }\\left(x^2\\right)\\,dx');expect(toggleIntegralBounds('\\int_{0}^{1}\\left(x^2\\right)\\,dx',false)).toBe(plain);});
  it('does not expand keywords inside ordinary words',()=>{expect(notationTemplate('point')).toBeNull();expect(notationTemplate('individual')).toBeNull();});
});
