import { describe, expect, it } from 'vitest';
import type { CaptureResult } from 'posthog-js';
import { scrubEvent, scrubPath, scrubUrl } from './analytics';

describe('analytics name scrubbing', () => {
  it('replaces name paths and keeps site pages', () => {
    expect(scrubPath('/harinii')).toBe('/[name]');
    expect(scrubPath('/')).toBe('/');
    expect(scrubPath('/privacy.html')).toBe('/privacy.html');
  });

  it('scrubs our own URLs, dropping unknown query params and hashes', () => {
    expect(scrubUrl('https://periodicnames.com/sasha-sriram?utm_source=reddit&x=sasha#top'))
      .toBe('https://periodicnames.com/[name]?utm_source=reddit');
    expect(scrubUrl('https://periodicnames.com/?order=success')).toBe('https://periodicnames.com/?order=success');
  });

  it('leaves other sites alone', () => {
    expect(scrubUrl('https://www.reddit.com/r/InternetIsBeautiful/')).toBe('https://www.reddit.com/r/InternetIsBeautiful/');
    expect(scrubUrl('$direct')).toBe('$direct');
  });

  it('scrubs every URL-like property and drops page titles', () => {
    const event = scrubEvent({
      uuid: '1',
      event: '$pageview',
      properties: {
        $current_url: 'https://periodicnames.com/harinii',
        $pathname: '/harinii',
        $referrer: 'https://periodicnames.com/ada',
        $title: 'Harinii in periodic table elements | Periodic Names',
        $session_entry_url: 'https://periodicnames.com/harinii',
        tiles: 6,
      },
      $set_once: { $initial_current_url: 'https://periodicnames.com/harinii', $initial_pathname: '/harinii' },
    } as CaptureResult)!;
    expect(JSON.stringify(event).toLowerCase()).not.toContain('harinii');
    expect(JSON.stringify(event).toLowerCase()).not.toContain('ada');
    expect(event.properties.$pathname).toBe('/[name]');
    expect(event.properties.tiles).toBe(6);
  });
});
