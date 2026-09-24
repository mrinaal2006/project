'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, User as UserIcon, Code } from "lucide-react";

export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span>Loading...</span>;
  }

  if (session) {
    return (
      <>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserIcon size={16} /> {session.user?.name || 'User'}
        </span>
        <Link href="/dashboard" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code size={16} /> Dashboard
        </Link>
        <button 
          onClick={() => signOut()} 
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="btn-secondary">Log In</Link>
      <Link href="/register" className="btn-primary">Register</Link>
    </>
  );
}
