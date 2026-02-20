// apps/frontend/src/hooks/useLocalStorage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear());

  it('should return initial value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should set and persist value', () => {
    const { result } = renderHook(() => useLocalStorage('key', ''));
    act(() => result.current[1]('hello'));
    expect(result.current[0]).toBe('hello');
    expect(localStorage.getItem('key')).toBe('"hello"');
  });

  it('should accept updater function', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(1);
  });

  it('should read existing value from localStorage', () => {
    localStorage.setItem('key', '"saved"');
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('saved');
  });

  it('should remove value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    act(() => result.current[1]('set'));
    act(() => result.current[2]());
    expect(result.current[0]).toBe('default');
    expect(localStorage.getItem('key')).toBeNull();
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorage.setItem('key', 'not-json');
    const { result } = renderHook(() => useLocalStorage('key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
