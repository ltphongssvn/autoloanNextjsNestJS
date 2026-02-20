// apps/frontend/src/hooks/useLocalStorage.ts
import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      return newValue;
    });
  }, [key]);

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    window.localStorage.removeItem(key);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
