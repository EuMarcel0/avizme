"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UsePersistedStateOptions<T> = {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T | undefined;
};

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options?: UsePersistedStateOptions<T>,
) {
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize =
    options?.deserialize ??
    ((raw: string) => {
      try {
        return JSON.parse(raw) as T;
      } catch {
        return undefined;
      }
    });

  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  serializeRef.current = serialize;
  deserializeRef.current = deserialize;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = deserializeRef.current(raw);
        if (parsed !== undefined) setValue(parsed);
      }
    } catch {
      // ignore quota / private mode
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(key, serializeRef.current(value));
    } catch {
      // ignore
    }
  }, [key, value, hydrated]);

  const setPersistedValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue(next);
    },
    [],
  );

  return [value, setPersistedValue, hydrated] as const;
}
