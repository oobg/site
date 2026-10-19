const eventValues = {
  search_open: ['header', 'shortcut'],
  search_result_open: ['palette', 'archive'],
  article_share: ['copy', 'native_share'],
  related_article_open: ['related', 'previous', 'next'],
} as const;

export type PublicEvent = keyof typeof eventValues;
export type PublicEventValue<T extends PublicEvent> = (typeof eventValues)[T][number];

export function isPublicEvent(name: string, value: string): name is PublicEvent {
  return (
    Object.hasOwn(eventValues, name) &&
    (eventValues[name as PublicEvent] as readonly string[]).includes(value)
  );
}

/** Only fixed enums cross the collection boundary; never pass user input or URLs. */
export function trackPublicEvent<T extends PublicEvent>(name: T, value: PublicEventValue<T>) {
  if (typeof window === 'undefined' || !isPublicEvent(name, value)) return;
  window.__ravenAnalytics?.track(name, value);
}
