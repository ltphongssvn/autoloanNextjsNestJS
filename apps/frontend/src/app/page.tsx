// apps/frontend/src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section data-testid="hero">
        <h1>AutoLoan Application Platform</h1>
        <p>Apply for your auto loan online — fast, secure, and easy.</p>
        <div>
          <Link href="/login" data-testid="cta-login">Sign In</Link>
          <Link href="/signup" data-testid="cta-signup">Create Account</Link>
        </div>
      </section>

      <section data-testid="features">
        <h2>Why Choose AutoLoan?</h2>
        <ul>
          <li data-testid="feature-item">
            <h3>Quick Application</h3>
            <p>Complete your loan application in minutes with our step-by-step process.</p>
          </li>
          <li data-testid="feature-item">
            <h3>Real-Time Tracking</h3>
            <p>Monitor your application status and receive updates at every stage.</p>
          </li>
          <li data-testid="feature-item">
            <h3>Secure & Private</h3>
            <p>Your data is encrypted and protected with industry-standard security.</p>
          </li>
        </ul>
      </section>
    </main>
  );
}
