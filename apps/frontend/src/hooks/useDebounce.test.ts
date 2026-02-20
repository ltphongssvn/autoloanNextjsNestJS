// apps/frontend/src/hooks/useDebounce.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello'));
    expect(result.current).toBe('hello');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), { initialProps: { value: 'a' } });
    expect(result.current).toBe('a');
    rerender({ value: 'ab' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe('ab');
  });

  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), { initialProps: { value: 'x' } });
    rerender({ value: 'xy' });
    expect(result.current).toBe('x');
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('xy');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), { initialProps: { value: '1' } });
    rerender({ value: '12' });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: '123' });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('1');
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('123');
  });
});
