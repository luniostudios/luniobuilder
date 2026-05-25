import { SessionProvider } from "next-auth/react"
import { Suspense } from "react";
import ProjectSettingsPage from "./Settings";

const page = () => {
  return (
    <SessionProvider>
      <Suspense fallback={<div className='min-h-screen bg-[#0d1117] text-white flex items-center justify-center'>Loading dashboard…</div>}>
      <ProjectSettingsPage />
      </Suspense>
    </SessionProvider>
  )
}

export default page