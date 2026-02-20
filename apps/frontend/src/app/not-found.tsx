// apps/frontend/src/app/not-found.tsx
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main data-testid="not-found">
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/">Go Home</Link>
    </main>
  );
}
