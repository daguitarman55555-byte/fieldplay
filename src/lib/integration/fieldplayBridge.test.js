import { describe, expect, it } from 'vitest';
import { connectMessaging, createGradientFieldCode, installFieldPlayBridge } from './fieldplayBridge';

describe('FieldPlay bridge', () => {
  it('generates a central-difference gradient field', () => {
    const code=createGradientFieldCode('x*x + y*y');
    expect(code).toContain('studio_scalar');
    expect(code).toContain('vec2 get_velocity');
  });
  it('rejects statements in scalar expressions', () => expect(()=>createGradientFieldCode('x; discard')).toThrow());
  it('exposes a stable embedding API', async () => {
    const scene=fakeScene();
    const target={dispatchEvent:()=>{}}; const bridge=installFieldPlayBridge(scene,target);
    expect(target.FieldPlay.version).toBe(2);
    expect((await bridge.setGradientField('x^2+y^2')).type).toBe('gradient');
    expect(bridge.evaluate([[2,3]])[0]).toEqual(expect.arrayContaining([expect.closeTo(4,3),expect.closeTo(6,3)]));
    const grid=bridge.sampleGrid({cols:4,rows:3});expect(grid.fx).toHaveLength(20);expect(grid.fy).toHaveLength(20);
    bridge.dispose();
  });
  it('accepts Desmos-style vector expressions and validates requests', async()=>{
    const bridge=installFieldPlayBridge(fakeScene(),{dispatchEvent:()=>{}});
    await bridge.setExpressions({x:'2x-y',y:'x+y',parameters:{a:1}});
    expect(bridge.evaluate([{x:2,y:1}])).toEqual([[3,3]]);
    expect(()=>bridge.setViewport({minX:1,maxX:-1,minY:-1,maxY:1})).toThrow('ordered');
    bridge.dispose();
  });
  it('only accepts postMessage commands from allowed origins',async()=>{
    let handler,response;const target={location:{origin:'https://fieldplay.test'},addEventListener:(_,fn)=>handler=fn,removeEventListener:()=>{}},api={getState:()=>({ready:true})};
    const disconnect=connectMessaging(api,target,{allowedOrigins:['https://desmos.test']});
    await handler({origin:'https://evil.test',data:{type:'fieldplay:command',method:'getState'},source:{postMessage:value=>response=value}});expect(response).toBeUndefined();
    await handler({origin:'https://desmos.test',data:{type:'fieldplay:command',id:7,method:'getState'},source:{postMessage:value=>response=value}});expect(response).toMatchObject({id:7,result:{ready:true}});disconnect();
  });
});

function fakeScene(){let code='code',bounds={minX:-1,maxX:1,minY:-1,maxY:1};return{vectorFieldEditorState:{setCode:value=>{code=value;return Promise.resolve(value);},getCode:()=>code},applyBoundingBox:value=>bounds=value,getBoundingBox:()=>bounds,getParticlesCount:()=>10,getPaused:()=>false,setPaused:()=>{}};}
