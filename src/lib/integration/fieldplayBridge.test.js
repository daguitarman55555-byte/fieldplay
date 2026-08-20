import { describe, expect, it } from 'vitest';
import { createGradientFieldCode, installFieldPlayBridge } from './fieldplayBridge';

describe('FieldPlay bridge', () => {
  it('generates a central-difference gradient field', () => {
    const code=createGradientFieldCode('x*x + y*y');
    expect(code).toContain('return x*x + y*y');
    expect(code).toContain('vec2 get_velocity');
  });
  it('rejects statements in scalar expressions', () => expect(()=>createGradientFieldCode('x; discard')).toThrow());
  it('exposes a stable embedding API', async () => {
    const scene={vectorFieldEditorState:{setCode:code=>Promise.resolve(code),getCode:()=> 'code'},applyBoundingBox:()=>{},getBoundingBox:()=>({minX:-1,maxX:1,minY:-1,maxY:1}),getParticlesCount:()=>10,onFrame:()=>()=>{}};
    const target={dispatchEvent:()=>{}}; const bridge=installFieldPlayBridge(scene,target);
    expect(target.FieldPlay.version).toBe(1); expect((await bridge.setGradientField('x')).includes('scalar_field')).toBe(true);
  });
});
