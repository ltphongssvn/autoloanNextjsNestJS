// apps/frontend/src/components/Navigation.tsx
'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
export default function Navigation() {
  const { user, logout } = useAuth();
  if (!user) {
    return (
      <nav className="bg-white border-b px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold text-blue-600">AutoLoan</Link>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Sign In</Link>
          <Link href="/signup" className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Create Account</Link>
        </div>
      </nav>
    );
  }
  const dashboardLink = user.role === 'loan_officer' ? '/dashboard/loan-officer'
    : user.role === 'underwriter' ? '/dashboard/underwriter'
    : '/dashboard';
  return (
    <nav className="bg-white border-b px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
      <Link href={dashboardLink} className="text-xl font-bold text-blue-600">AutoLoan</Link>
      <div className="flex gap-4 items-center">
        <Link href={dashboardLink} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Dashboard</Link>
        {user.role === 'customer' && <Link href="/dashboard/applications/new" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">New Application</Link>}
        <Link href="/dashboard/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Profile</Link>
        <NotificationBell />
        <span data-testid="nav-user" className="text-sm text-gray-500">{user.full_name}</span>
        <button onClick={logout} className="text-sm px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition">Logout</button>
      </div>
    </nav>
  );
}
