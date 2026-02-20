// apps/frontend/src/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('formatCurrency', () => {
  it('formats number', () => expect(formatCurrency(25000)).toBe('$25,000.00'));
  it('formats string', () => expect(formatCurrency('1234.56')).toBe('$1,234.56'));
  it('returns N/A for null', () => expect(formatCurrency(null)).toBe('N/A'));
  it('returns N/A for undefined', () => expect(formatCurrency(undefined)).toBe('N/A'));
  it('returns N/A for NaN string', () => expect(formatCurrency('abc')).toBe('N/A'));
  it('formats zero', () => expect(formatCurrency(0)).toBe('$0.00'));
});

describe('formatDate', () => {
  it('formats ISO string', () => expect(formatDate('2026-01-15T12:00:00Z')).toBe('Jan 15, 2026'));
  it('formats Date object', () => expect(formatDate(new Date(2026, 5, 1))).toBe('Jun 1, 2026'));
  it('returns N/A for null', () => expect(formatDate(null)).toBe('N/A'));
  it('returns N/A for undefined', () => expect(formatDate(undefined)).toBe('N/A'));
  it('returns N/A for empty string', () => expect(formatDate('')).toBe('N/A'));
  it('returns N/A for invalid date', () => expect(formatDate('not-a-date')).toBe('N/A'));
});
