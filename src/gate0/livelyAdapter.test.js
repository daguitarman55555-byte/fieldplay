import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Lively adapter', () => {
  afterEach(() => vi.resetModules());

  it('publishes playback state and audio without replacing host callbacks', async () => {
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    const adapter = await import('./livelyAdapter');
    const states=[]; const audio=[];
    adapter.subscribeToLively(value => states.push(value));
    adapter.subscribeToLivelyAudio(value => audio.push(value));
    window.livelyWallpaperPlaybackChanged('{"IsPaused":true}');
    window.livelyAudioListener('[0.1,0.2]');
    expect(states.at(-1).paused).toBe(true);
    expect(states.at(-1).audioLength).toBe(2);
    expect(audio).toEqual([[0.1,0.2]]);
  });
});
