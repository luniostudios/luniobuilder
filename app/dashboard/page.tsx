import { SessionProvider } from "next-auth/react"
import { Suspense } from "react";
import Dashboard from "./dashboard";

const page = () => {
  return (
    <SessionProvider>
      <Suspense fallback={<div className='min-h-screen bg-background text-white flex items-center justify-center'>Loading dashboard…</div>}>
      <Dashboard />
      </Suspense>
    </SessionProvider>
  )
}

export default page