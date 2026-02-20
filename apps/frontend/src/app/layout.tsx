// apps/frontend/src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navigation from '../components/Navigation';
import ToastContainer from '../components/Toast';

export const metadata = {
  title: 'Auto Loan Application System',
  description: 'Apply for auto loans, track applications, and manage documents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <AuthProvider>
          <Navigation />
          <ToastContainer />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
