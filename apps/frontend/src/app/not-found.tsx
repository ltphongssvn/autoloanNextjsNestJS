// apps/frontend/src/app/not-found.tsx
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main data-testid="not-found" className="max-w-md mx-auto px-4 py-32 text-center">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-8">The page you are looking for does not exist.</p>
      <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Go Home</Link>
    </main>
  );
}
