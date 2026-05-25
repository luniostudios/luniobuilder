import { SessionProvider } from "next-auth/react"
import Dashboard from "./dashboard";
import { Suspense } from "react";
import Dashboard2 from "./dashboard2";

const page = () => {
  return (
    <SessionProvider>
      <Suspense fallback={<div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>Loading dashboard…</div>}>
      <Dashboard2 />
      </Suspense>
    </SessionProvider>
  )
}

export default page