import { Entity, LiveData, ObjectPool } from '@toeverything/infra';
import ICAL from 'ical.js';
import { Observable, switchMap } from 'rxjs';

import type {
  CalendarStore,
  CalendarSubscriptionConfig,
} from '../store/calendar';
import { CalendarSubscription } from './calendar-subscription';

export class CalendarIntegration extends Entity {
  constructor(private readonly store: CalendarStore) {
    super();
  }

  private readonly subscriptionPool = new ObjectPool<
    string,
    CalendarSubscription
  >();

  colors = this.store.colors;
  subscriptions$ = LiveData.from(
    this.store.watchSubscriptionMap().pipe(
      switchMap(subs => {
        const refs = Object.entries(subs ?? {}).map(([url]) => {
          const exists = this.subscriptionPool.get(url);
          if (exists) {
            return exists;
          }
          const subscription = this.framework.createEntity(
            CalendarSubscription,
            { url }
          );
          const ref = this.subscriptionPool.put(url, subscription);
          return ref;
        });

        return new Observable<CalendarSubscription[]>(subscribe => {
          subscribe.next(refs.map(ref => ref.obj));
          return () => {
            refs.forEach(ref => ref.release());
          };
        });
      })
    ),
    []
  );

  async verifyUrl(_url: string) {
    let url = _url;
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol === 'webcal:') {
        urlObj.protocol = 'https';
      }
      url = urlObj.toString();
    } catch (err) {
      console.error(err);
      throw new Error('Invalid URL');
    }
    try {
      const response = await fetch(url);
      const content = await response.text();
      ICAL.parse(content);
      return content;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to verify URL');
    }
  }

  async createSubscription(url: string) {
    try {
      const content = await this.verifyUrl(url);
      this.store.addSubscription(url);
      this.store.setSubscriptionCache(url, content).catch(console.error);
    } catch (err) {
      console.error(err);
      throw new Error('Failed to verify URL');
    }
  }

  deleteSubscription(url: string) {
    this.store.removeSubscription(url);
  }

  updateSubscription(
    url: string,
    updates: Partial<Omit<CalendarSubscriptionConfig, 'url'>>
  ) {
    this.store.updateSubscription(url, updates);
  }
}
