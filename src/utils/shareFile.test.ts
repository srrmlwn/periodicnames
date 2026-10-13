import { describe, expect, it, vi } from 'vitest';
import { canShareFile, copyText, shareOrDownload } from './shareFile';

const file = new File(['data'], 'periodicnames-sasha-reel.mp4', { type: 'video/mp4' });

describe('canShareFile', () => {
  it('is false when the Web Share API is missing', () => {
    expect(canShareFile(file, {})).toBe(false);
  });

  it('is false when canShare rejects files', () => {
    expect(canShareFile(file, { canShare: () => false, share: async () => {} })).toBe(false);
  });

  it('is false when canShare throws', () => {
    expect(canShareFile(file, { canShare: () => { throw new TypeError('bad'); }, share: async () => {} })).toBe(false);
  });

  it('is true when files can be shared', () => {
    expect(canShareFile(file, { canShare: () => true, share: async () => {} })).toBe(true);
  });
});

describe('shareOrDownload', () => {
  it('downloads when file sharing is unsupported', async () => {
    const download = vi.fn();
    const res = await shareOrDownload(file, download, { canShare: () => false });
    expect(res).toEqual({ outcome: 'downloaded', reason: 'unsupported' });
    expect(download).toHaveBeenCalledWith(file);
  });

  it('shares the actual file when supported', async () => {
    const download = vi.fn();
    const share = vi.fn(async () => {});
    const res = await shareOrDownload(file, download, { canShare: () => true, share });
    expect(res).toEqual({ outcome: 'shared' });
    expect(share).toHaveBeenCalledWith({ files: [file] });
    expect(download).not.toHaveBeenCalled();
  });

  it('treats a cancelled share sheet as dismissed, without downloading', async () => {
    const download = vi.fn();
    const share = vi.fn(async () => { throw new DOMException('cancelled', 'AbortError'); });
    const res = await shareOrDownload(file, download, { canShare: () => true, share });
    expect(res).toEqual({ outcome: 'dismissed' });
    expect(download).not.toHaveBeenCalled();
  });

  it('falls back to download when the share sheet fails', async () => {
    const download = vi.fn();
    const share = vi.fn(async () => { throw new DOMException('no activation', 'NotAllowedError'); });
    const res = await shareOrDownload(file, download, { canShare: () => true, share });
    expect(res).toEqual({ outcome: 'downloaded', reason: 'share-failed' });
    expect(download).toHaveBeenCalledWith(file);
  });
});

describe('copyText', () => {
  it('uses the async clipboard when it works', async () => {
    const writeText = vi.fn(async () => {});
    const legacyCopy = vi.fn(() => true);
    expect(await copyText('https://periodicnames.com/sasha', { writeText, legacyCopy })).toBe(true);
    expect(legacyCopy).not.toHaveBeenCalled();
  });

  it('falls back when the clipboard is blocked', async () => {
    const writeText = vi.fn(async () => { throw new DOMException('denied', 'NotAllowedError'); });
    const legacyCopy = vi.fn(() => true);
    expect(await copyText('x', { writeText, legacyCopy })).toBe(true);
    expect(legacyCopy).toHaveBeenCalledWith('x');
  });

  it('reports failure when nothing can copy', async () => {
    expect(await copyText('x', {})).toBe(false);
    expect(await copyText('x', { legacyCopy: () => false })).toBe(false);
  });
});
