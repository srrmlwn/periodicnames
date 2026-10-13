export type ShareEventName =
  | 'share_modal_opened'
  | 'share_format_selected'
  | 'media_generation_started'
  | 'media_generation_completed'
  | 'media_generation_failed'
  | 'native_share_invoked'
  | 'native_share_completed'
  | 'native_share_dismissed'
  | 'media_downloaded'
  | 'share_link_copied';

export type EventProps = Record<string, string | number | boolean>;

type Gtag = (command: 'event', name: string, props: EventProps) => void;

export function track(name: ShareEventName, props: EventProps = {}): void {
  try {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    gtag?.('event', name, props);
    if (import.meta.env.DEV) console.debug('[track]', name, props);
  } catch {
    // analytics must never break sharing
  }
}
