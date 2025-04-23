import {
  catchErrorInto,
  effect,
  Entity,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import ICAL from 'ical.js';
import { switchMap } from 'rxjs';

import type {
  CalendarStore,
  CalendarSubscriptionConfig,
} from '../store/calendar';

export class CalendarSubscription extends Entity<{ url: string }> {
  constructor(private readonly store: CalendarStore) {
    super();
  }

  config$ = LiveData.from(
    this.store.watchSubscription(this.props.url),
    {} as CalendarSubscriptionConfig
  );
  content$ = LiveData.from(
    this.store.watchSubscriptionCache(this.props.url),
    ''
  );
  name$ = this.content$.selector(content => {
    if (!content) return '';
    try {
      const jCal = ICAL.parse(content ?? '');
      const vCalendar = new ICAL.Component(jCal);
      return (vCalendar.getFirstPropertyValue('x-wr-calname') as string) || '';
    } catch {
      return '';
    }
  });

  url = this.props.url;
  loading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  update = effect(
    switchMap(() =>
      fromPromise(async () => {
        const response = await fetch(this.url);
        const cache = await response.text();
        this.store.setSubscriptionCache(this.url, cache).catch(console.error);
      }).pipe(
        catchErrorInto(this.error$),
        onStart(() => this.loading$.setValue(true)),
        onComplete(() => this.loading$.setValue(false))
      )
    )
  );
}
