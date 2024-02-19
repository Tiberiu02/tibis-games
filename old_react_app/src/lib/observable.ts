import { useEffect, useState } from "react";

export type Observable<T> = {
  get: () => Readonly<T>;
  set: (value: T) => void;
  subscribe: (callback: (value: T) => void) => () => void;
  unsubscribe: (callback: (value: T) => void) => void;
};

export function createObservable<T>(initialValue: T): Observable<T> {
  const subscribers = new Set<(value: T) => void>();
  let value = initialValue;

  return {
    get() {
      return value;
    },
    set(newValue: T) {
      value = newValue;
      for (const subscriber of subscribers) {
        subscriber(value);
      }
    },
    subscribe(callback: (value: T) => void) {
      subscribers.add(callback);
      return () => {
        subscribers.delete(callback);
      };
    },
    unsubscribe(callback: (value: T) => void) {
      subscribers.delete(callback);
    },
  };
}

export function useObservable<T>(observable: Observable<T>) {
  const [value, setValue] = useState(observable.get());

  useEffect(() => {
    observable.subscribe(setValue);
    return () => {
      observable.unsubscribe(setValue);
    };
  }, [observable]);

  return value;
}
