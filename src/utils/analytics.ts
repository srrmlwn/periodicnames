import type { CaptureResult, PostHog } from 'posthog-js';

export type AnalyticsEventName =
  | 'name_spelled'
  | 'share_modal_opened'
  | 'share_format_selected'
  | 'media_generation_started'
  | 'media_generation_completed'
  | 'media_generation_failed'
  | 'native_share_invoked'
  | 'native_share_completed'
  | 'native_share_dismissed'
  | 'media_downloaded'
  | 'share_link_copied'
  | 'tee_designer_opened'
  | 'tee_model_photo_requested'
  | 'tee_buy_clicked'
  | 'order_success_viewed';

export type EventProps = Record<string, string | number | boolean>;

const POSTHOG_KEY = 'phc_ppDmHiPF3vqF9ZYNjWmfE9EKr6V8dhAaZYyt4mNcQLaT';
const POSTHOG_HOST = 'https://us.i.posthog.com';
const PRODUCTION_HOSTS = new Set(['periodicnames.com', 'www.periodicnames.com']);
const SITE_PATHS = new Set(['/', '/privacy.html', '/tos.html', '/names', '/order']);
const KEPT_QUERY_PARAMS = /^(utm_[a-z]+|ref|order)$/;
const URL_PROPERTY = /url|pathname|referrer/i;
const TITLE_PROPERTIES = ['$title', 'title'];

const enabled = import.meta.env.PROD && PRODUCTION_HOSTS.has(window.location.hostname);
let client: PostHog | null = null;
const queued: [AnalyticsEventName | '$pageview', EventProps][] = [];

export function scrubPath(pathname: string): string {
  return SITE_PATHS.has(pathname) || pathname.startsWith('/api/') ? pathname : '/[name]';
}

export function scrubUrl(value: string): string {
  if (value.startsWith('/')) return scrubPath(value);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (!PRODUCTION_HOSTS.has(url.hostname)) return value;
  url.pathname = scrubPath(url.pathname);
  for (const key of [...url.searchParams.keys()]) {
    if (!KEPT_QUERY_PARAMS.test(key)) url.searchParams.delete(key);
  }
  url.hash = '';
  return url.toString();
}

function scrubProperties(properties: Record<string, unknown> | undefined): void {
  if (!properties) return;
  for (const key of Object.keys(properties)) {
    const value = properties[key];
    if (TITLE_PROPERTIES.includes(key)) delete properties[key];
    else if (typeof value === 'string' && URL_PROPERTY.test(key)) properties[key] = scrubUrl(value);
  }
}

export function scrubEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event) return event;
  scrubProperties(event.properties);
  scrubProperties(event.$set);
  scrubProperties(event.$set_once);
  return event;
}

function send(name: AnalyticsEventName | '$pageview', props: EventProps): void {
  if (!enabled) return;
  if (client) client.capture(name, props);
  else queued.push([name, props]);
}

export function initAnalytics(): void {
  if (!enabled) return;
  queued.unshift(['$pageview', {}]);
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        cookieless_mode: 'always',
        person_profiles: 'identified_only',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        disable_surveys: true,
        capture_heatmaps: false,
        capture_dead_clicks: false,
        rageclick: false,
        advanced_disable_flags: true,
        before_send: scrubEvent,
      });
      client = posthog;
      queued.splice(0).forEach(([name, props]) => posthog.capture(name, props));
    })
    .catch(() => undefined);
}

export function track(name: AnalyticsEventName, props: EventProps = {}): void {
  try {
    send(name, props);
    if (import.meta.env.DEV) console.debug('[track]', name, props);
  } catch {
    return;
  }
}
