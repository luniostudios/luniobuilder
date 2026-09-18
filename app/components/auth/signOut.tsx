'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function SignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="mt-5 flex items-center text-red-400 outline-none transition-colors hover:text-red-300"
    >
      <LogOut size={16} className="mr-2" />
      Sign Out
    </button>
  );
}