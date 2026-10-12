import type { SceneTimeline } from './shareScene';
import { tileImpactTimes } from './shareScene';

let audioContext: AudioContext | null = null;

export function primeShareAudio(): void {
  if (typeof AudioContext === 'undefined') return;
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
}

export function getShareAudio(): AudioContext | null {
  return audioContext && audioContext.state === 'running' ? audioContext : null;
}

const POP_NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

function tone(ctx: AudioContext, out: AudioNode, at: number, freq: number, dur: number, gain: number, type: OscillatorType, slideTo?: number): void {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur * 0.6);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function click(ctx: AudioContext, out: AudioNode, at: number): void {
  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  src.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 2200;
  amp.gain.value = 0.35;
  src.connect(filter).connect(amp).connect(out);
  src.start(at);
}

export function scheduleReelSounds(ctx: AudioContext, out: AudioNode, tl: SceneTimeline, chars: number, startAt: number): void {
  const s = (ms: number) => startAt + ms / 1000;
  for (let i = 0; i < chars; i++) click(ctx, out, s(tl.typeStart + i * tl.charMs));
  tone(ctx, out, s(tl.cardIn), 180, 0.22, 0.25, 'sine', 90);
  tileImpactTimes(tl).forEach((at, i) => {
    const note = POP_NOTES[i % POP_NOTES.length] * (i >= POP_NOTES.length ? 2 : 1);
    tone(ctx, out, s(at - 20), note, 0.22, 0.32, 'triangle');
    tone(ctx, out, s(at - 20), 140, 0.12, 0.35, 'sine', 60);
  });
  tone(ctx, out, s(tl.stickerIn + 60), 110, 0.2, 0.45, 'sine', 50);
  [1046.5, 1318.51, 1567.98].forEach((f, i) => tone(ctx, out, s(tl.stickerIn + 90 + i * 40), f, 0.5, 0.16, 'triangle'));
  [1567.98, 2093].forEach(f => tone(ctx, out, s(tl.ctaIn + 120), f, 0.9, 0.12, 'sine'));
}
