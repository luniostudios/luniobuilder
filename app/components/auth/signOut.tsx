'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function SignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className=" flex justify-between items-center text-white/50 outline-none transition-colors hover:text-white"
    >
      Sign Out
      <LogOut size={16} className="mr-2 text-red-300" />
    </button>
  );
}