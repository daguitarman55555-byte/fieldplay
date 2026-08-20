import { describe, expect, it } from 'vitest';
import { SCENES, createSceneController, hashSeed, normalizePalette, normalizeScene } from './sceneController';

describe('scene controller', () => {
  it('selects deterministic starting scenes from seeds', () => {
    expect(createSceneController({seed:'same'}).snapshot()).toEqual(createSceneController({seed:'same'}).snapshot());
    expect(hashSeed('same')).toBe(hashSeed('same'));
  });
  it('rotates every scene in auto mode', () => {
    const controller=createSceneController({seed:'rotation',interval:100});
    const first=controller.snapshot().index;
    for(let i=0;i<SCENES.length;i++) controller.update(100);
    expect(controller.snapshot().index).toBe(first);
  });
  it('holds explicitly selected scenes and repairs invalid settings', () => {
    const controller=createSceneController({scene:'galaxy',interval:1});
    controller.update(5000);
    expect(controller.snapshot().name).toBe('galaxy');
    expect(normalizeScene('wrong')).toBe('auto');
    expect(normalizePalette('wrong')).toBe('cosmic');
  });
});
