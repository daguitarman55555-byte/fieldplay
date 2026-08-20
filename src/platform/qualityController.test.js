import { describe, expect, it } from 'vitest';
import { createQualityController } from './qualityController';

describe('quality controller', () => {
  it('backs off after sustained missed deadlines', () => {
    const controller=createQualityController({profile:'showcase',targetFps:60});
    for(let i=0;i<12;i++) controller.sample({frameMs:30,gpuLoad:50});
    expect(controller.current().name).toBe('wallpaper');
  });
  it('backs off when the rest of the system saturates the GPU', () => {
    const controller=createQualityController({profile:'wallpaper'});
    for(let i=0;i<12;i++) controller.sample({frameMs:10,gpuLoad:95});
    expect(controller.current().name).toBe('eco');
  });
  it('never exceeds the requested profile', () => {
    const controller=createQualityController({profile:'eco'});
    for(let i=0;i<300;i++) controller.sample({frameMs:2,gpuLoad:5});
    expect(controller.current().name).toBe('eco');
  });
});
