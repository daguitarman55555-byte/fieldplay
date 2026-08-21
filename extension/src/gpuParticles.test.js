import{describe,expect,it}from'vitest';import{particleBoundsKey}from'./gpuParticles.js';
describe('particle viewport synchronization',()=>{it('changes whenever a visible math bound changes',()=>{const a={left:-10,right:10,bottom:-5,top:5};expect(particleBoundsKey(a)).not.toBe(particleBoundsKey({...a,left:-9}));expect(particleBoundsKey(a)).toBe(particleBoundsKey({...a}));});});
