// apps/frontend/src/components/LoadingSkeleton.tsx
export default function LoadingSkeleton({ rows = 3, showHeader = true }: { rows?: number; showHeader?: boolean }) {
  return (
    <div role="status" data-testid="loading-skeleton" className="animate-pulse space-y-3">
      {showHeader && <div data-testid="skeleton-header" className="h-6 bg-gray-200 rounded w-1/3" />}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} data-testid="skeleton-row" className="h-4 bg-gray-200 rounded" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}
