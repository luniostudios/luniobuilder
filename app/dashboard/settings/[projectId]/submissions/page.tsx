import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import SubmissionsDashboard from '../SubmissionsDashboard';

export default async function SubmissionsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <SessionProvider>
      <Suspense fallback={<div className='min-h-screen bg-[#111214] text-white flex items-center justify-center'>Loading submissions...</div>}>
        <div className='min-h-screen bg-[#111214] text-white'>
          <header className='flex h-14 items-center justify-between border-b border-gray-800 bg-[#0d1117] px-5'>
            <div className='flex items-center gap-3'>
              <h1 className='text-sm font-semibold'>Form submissions</h1>
              <a href={`/editor?projectId=${projectId}`} className='rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800'>Open editor</a>
            </div>
          </header>

          <main className='p-5'>
            <div className='mx-auto max-w-6xl'>
              <SubmissionsDashboard projectId={projectId} />
            </div>
          </main>
        </div>
      </Suspense>
    </SessionProvider>
  );
}