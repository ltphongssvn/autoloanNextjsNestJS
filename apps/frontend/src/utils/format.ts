// apps/frontend/src/utils/format.ts
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'N/A';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
