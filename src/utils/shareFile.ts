export interface ShareCapable {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
}

export type ShareOutcome =
  | { outcome: 'shared' }
  | { outcome: 'dismissed' }
  | { outcome: 'downloaded'; reason: 'unsupported' | 'share-failed' };

export function canShareFile(file: File, env: ShareCapable = navigator): boolean {
  try {
    return typeof env.share === 'function' && !!env.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}

export async function shareOrDownload(file: File, download: (file: File) => void, env: ShareCapable = navigator): Promise<ShareOutcome> {
  if (!canShareFile(file, env)) {
    download(file);
    return { outcome: 'downloaded', reason: 'unsupported' };
  }
  try {
    await env.share!({ files: [file] });
    return { outcome: 'shared' };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return { outcome: 'dismissed' };
    download(file);
    return { outcome: 'downloaded', reason: 'share-failed' };
  }
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export interface ClipboardEnv {
  writeText?: (text: string) => Promise<void>;
  legacyCopy?: (text: string) => boolean;
}

function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

export async function copyText(text: string, env?: ClipboardEnv): Promise<boolean> {
  const writeText = env ? env.writeText : navigator.clipboard?.writeText?.bind(navigator.clipboard);
  const fallback = env ? env.legacyCopy : legacyCopy;
  if (writeText) {
    try {
      await writeText(text);
      return true;
    } catch {
      // fall through to the legacy copy path
    }
  }
  return fallback ? fallback(text) : false;
}

export function canShareLink(url: string, env: ShareCapable = navigator): boolean {
  try {
    return typeof env.share === 'function' && (env.canShare ? env.canShare({ url }) : true);
  } catch {
    return false;
  }
}

export type LinkShareOutcome = 'shared' | 'dismissed' | 'failed';

export async function shareLink(url: string, text: string, env: ShareCapable = navigator): Promise<LinkShareOutcome> {
  try {
    await env.share!({ url, text });
    return 'shared';
  } catch (err) {
    return err instanceof Error && err.name === 'AbortError' ? 'dismissed' : 'failed';
  }
}
