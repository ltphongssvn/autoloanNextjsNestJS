// apps/frontend/src/components/Navigation.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <nav>
        <Link href="/">Home</Link>
        <Link href="/login">Sign In</Link>
        <Link href="/signup">Create Account</Link>
      </nav>
    );
  }

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      {user.role === 'customer' && <Link href="/dashboard/applications/new">New Application</Link>}
      <Link href="/dashboard/profile">Profile</Link>
      <span data-testid="nav-user">{user.full_name}</span>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}
