import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import CmsManager from './CmsManager';

export default async function CmsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <SessionProvider>
      <Suspense fallback={<div className='min-h-screen bg-[#f7f8fa] flex items-center justify-center text-sm text-gray-500'>Loading CMS...</div>}>
        <div className='min-h-screen bg-[#f7f8fa] text-[#172033]'>
          <header className='flex h-14 items-center justify-between border-b border-gray-200 bg-white px-5'>
            <div className='flex items-center gap-3'>
              <a href={`/dashboard/settings/${projectId}`} className='text-sm text-gray-500 hover:text-gray-900'>Project settings</a>
              <span className='text-gray-300'>/</span>
              <h1 className='text-sm font-semibold'>CMS Collections</h1>
            </div>
            <a href={`/editor?projectId=${projectId}`} className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50'>Open editor</a>
          </header>
          <main className='p-5'>
            <CmsManager projectId={projectId} />
          </main>
        </div>
      </Suspense>
    </SessionProvider>
  );
}
