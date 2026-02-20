// apps/frontend/src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <section data-testid="hero" className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">AutoLoan Application Platform</h1>
        <p className="text-lg text-gray-600 mb-8">Apply for your auto loan in minutes. Track your application in real time.</p>
        <div className="flex justify-center gap-4">
          <Link href="/login" data-testid="cta-login" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Log In</Link>
          <Link href="/signup" data-testid="cta-signup" className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition">Sign Up</Link>
        </div>
      </section>
      <section data-testid="features">
        <h2 className="text-2xl font-bold text-center mb-8">Why Choose AutoLoan?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div data-testid="feature-item" className="p-6 bg-white rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-2">Quick Application</h3>
            <p className="text-gray-600">Complete your loan application in 4 simple steps with our guided form.</p>
          </div>
          <div data-testid="feature-item" className="p-6 bg-white rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-2">Real-Time Tracking</h3>
            <p className="text-gray-600">Monitor your application status and get updates as your loan progresses.</p>
          </div>
          <div data-testid="feature-item" className="p-6 bg-white rounded-xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-600">Your data is encrypted and protected with industry-standard security.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
