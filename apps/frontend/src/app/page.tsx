import Link from 'next/link';
import PaymentCalculator from '../components/PaymentCalculator';

export default function HomePage() {
  return (
    <main>
      <nav className="flex justify-between items-center px-6 py-4 bg-gradient-to-br from-indigo-500 to-purple-600">
        <span className="text-white text-lg font-bold">Auto Loan</span>
        <Link href="/login" data-testid="cta-login" className="px-4 py-2 border border-white text-white rounded-lg font-medium hover:bg-white/10 transition">Login</Link>
      </nav>
      <section data-testid="hero" className="text-center py-20 px-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Get Your Auto Loan in 15 minutes</h1>
        <p className="text-lg mb-8 opacity-90">Fast online approval with minimal documentation. Drive away in your new car today.</p>
        <Link href="/signup" data-testid="cta-apply" className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">Apply Now</Link>
      </section>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <PaymentCalculator />
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
      </div>
    </main>
  );
}
