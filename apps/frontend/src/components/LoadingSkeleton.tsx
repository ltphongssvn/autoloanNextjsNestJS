// apps/frontend/src/components/LoadingSkeleton.tsx
interface LoadingSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

export default function LoadingSkeleton({ rows = 3, showHeader = true }: LoadingSkeletonProps) {
  return (
    <div role="status" data-testid="loading-skeleton" aria-label="Loading content">
      {showHeader && <div data-testid="skeleton-header" style={{ height: 32, background: '#e5e7eb', borderRadius: 4, marginBottom: 16, width: '40%' }} />}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} data-testid="skeleton-row" style={{ height: 20, background: '#e5e7eb', borderRadius: 4, marginBottom: 12, width: `${100 - i * 10}%` }} />
      ))}
    </div>
  );
}
