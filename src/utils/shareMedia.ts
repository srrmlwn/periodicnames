import type { NameResult } from '../types';
import { ensureCanvasFonts } from './canvasTile';
import { SHARE_SIZES, buildShareScene, canvasTextMeasure, drawShareScene, sceneTimeline } from './shareScene';
import type { ShareFormat } from './shareScene';
import { getShareAudio, scheduleReelSounds } from './shareAudio';

const REEL_MIME_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

const FPS = 30;
const VIDEO_BITRATE = 8_000_000;
const TAIL_MS = 200;

export function reelMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement.prototype.captureStream !== 'function') return null;
  return REEL_MIME_TYPES.find(m => MediaRecorder.isTypeSupported(m)) ?? null;
}

export function shareSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

export function shareFileName(name: string, format: ShareFormat, mime: string): string {
  const ext = mime.startsWith('video/mp4') ? 'mp4' : mime.startsWith('video/webm') ? 'webm' : 'png';
  return `periodicnames-${shareSlug(name)}-${format}.${ext}`;
}

export async function renderShareImage(result: NameResult, caption: string, format: ShareFormat): Promise<Blob> {
  await ensureCanvasFonts();
  const { width, height } = SHARE_SIZES[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  drawShareScene(ctx, buildShareScene(result, caption, format, canvasTextMeasure(ctx)));
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), 'image/png');
  });
}

export async function recordShareReel(
  canvas: HTMLCanvasElement,
  result: NameResult,
  caption: string,
  signal: AbortSignal,
  onProgress: (ratio: number) => void,
): Promise<Blob> {
  const mimeType = reelMimeType();
  if (!mimeType) throw new Error('Video recording is not supported in this browser');
  await ensureCanvasFonts();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  const { width, height } = SHARE_SIZES.reel;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const scene = buildShareScene(result, caption, 'reel', canvasTextMeasure(ctx));
  const timeline = sceneTimeline(scene);
  drawShareScene(ctx, scene, 0, timeline);

  const videoStream = canvas.captureStream(FPS);
  const audio = getShareAudio();
  const audioOut = audio?.createMediaStreamDestination() ?? null;
  const stream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...(audioOut ? audioOut.stream.getAudioTracks() : []),
  ]);

  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITRATE });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise<Blob>((resolve, reject) => {
    let frame = 0;
    const cleanup = () => {
      cancelAnimationFrame(frame);
      stream.getTracks().forEach(track => track.stop());
      audioOut?.disconnect();
    };
    const onAbort = () => {
      recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });

    recorder.onstop = () => {
      signal.removeEventListener('abort', onAbort);
      cleanup();
      resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
    };
    recorder.onerror = () => {
      signal.removeEventListener('abort', onAbort);
      cleanup();
      reject(new Error('Recording failed'));
    };

    recorder.start(250);
    const start = performance.now();
    if (audio && audioOut) scheduleReelSounds(audio, audioOut, timeline, scene.name.length, audio.currentTime + 0.02);

    const tick = (now: number) => {
      const elapsed = now - start;
      drawShareScene(ctx, scene, Math.min(elapsed, timeline.end), timeline);
      onProgress(Math.min(1, elapsed / timeline.end));
      if (elapsed < timeline.end + TAIL_MS) {
        frame = requestAnimationFrame(tick);
      } else if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    };
    frame = requestAnimationFrame(tick);
  });
}
