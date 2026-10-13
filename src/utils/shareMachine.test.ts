import { describe, expect, it } from 'vitest';
import { canStart, formatForKey, initialShareState, mediaFor, mediaKeyFor, shareReducer } from './shareMachine';
import type { ShareState } from './shareMachine';

const blob = new Blob(['x'], { type: 'video/mp4' });

function generating(key: 'video' | 'image-story'): ShareState {
  return shareReducer(initialShareState(true), { type: 'start', key });
}

describe('share generation state machine', () => {
  it('defaults to video when recording is supported, image otherwise', () => {
    expect(initialShareState(true).kind).toBe('video');
    expect(initialShareState(false).kind).toBe('image');
  });

  it('maps selections to cache keys and export formats', () => {
    expect(mediaKeyFor('video', 'post')).toBe('video');
    expect(mediaKeyFor('image', 'post')).toBe('image-post');
    expect(formatForKey('video')).toBe('reel');
    expect(formatForKey('image-wide')).toBe('wide');
  });

  it('goes idle → generating → ready', () => {
    const s0 = initialShareState(true);
    expect(mediaFor(s0, 'video').status).toBe('idle');
    const s1 = shareReducer(s0, { type: 'start', key: 'video' });
    expect(mediaFor(s1, 'video').status).toBe('generating');
    const s2 = shareReducer(s1, { type: 'succeed', key: 'video', blob, url: 'blob:1' });
    expect(mediaFor(s2, 'video')).toEqual({ status: 'ready', blob, url: 'blob:1' });
  });

  it('ignores a second start while generating (no duplicate requests)', () => {
    const s1 = generating('video');
    expect(canStart(s1, 'video')).toBe(false);
    expect(shareReducer(s1, { type: 'start', key: 'video' })).toBe(s1);
  });

  it('never regenerates a ready file', () => {
    const ready = shareReducer(generating('video'), { type: 'succeed', key: 'video', blob, url: 'blob:1' });
    expect(canStart(ready, 'video')).toBe(false);
    expect(shareReducer(ready, { type: 'start', key: 'video' })).toBe(ready);
  });

  it('keeps each format cached while the user switches formats', () => {
    const ready = shareReducer(generating('video'), { type: 'succeed', key: 'video', blob, url: 'blob:1' });
    const switched = shareReducer(shareReducer(ready, { type: 'selectKind', kind: 'image' }), { type: 'selectKind', kind: 'video' });
    expect(mediaFor(switched, 'video').status).toBe('ready');
  });

  it('allows retry after an error', () => {
    const failed = shareReducer(generating('video'), { type: 'fail', key: 'video', message: 'boom' });
    expect(mediaFor(failed, 'video')).toEqual({ status: 'error', message: 'boom' });
    expect(canStart(failed, 'video')).toBe(true);
    expect(mediaFor(shareReducer(failed, { type: 'start', key: 'video' }), 'video').status).toBe('generating');
  });

  it('ignores stale results for media that is not generating', () => {
    const s0 = initialShareState(true);
    expect(shareReducer(s0, { type: 'succeed', key: 'video', blob, url: 'blob:1' })).toBe(s0);
    expect(shareReducer(s0, { type: 'fail', key: 'video', message: 'late' })).toBe(s0);
  });

  it('generates formats independently', () => {
    const both = shareReducer(generating('video'), { type: 'start', key: 'image-story' });
    const storyReady = shareReducer(both, { type: 'succeed', key: 'image-story', blob, url: 'blob:2' });
    expect(mediaFor(storyReady, 'image-story').status).toBe('ready');
    expect(mediaFor(storyReady, 'video').status).toBe('generating');
  });
});
