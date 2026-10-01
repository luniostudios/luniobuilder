'use client';

import { useEffect, useState } from 'react';
import { Mail, ArrowUpRight, CalendarDays, FileText } from 'lucide-react';

interface FormSubmission {
  id: string;
  project_id: string;
  page_id: string;
  form_id: string;
  fields: Record<string, string | number | boolean | null>;
  created_at: string;
}

const formatValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return '—';
  return JSON.stringify(value);
};

export default function SubmissionsDashboard({ projectId }: { projectId: string }) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/forms/submissions?projectId=${encodeURIComponent(projectId)}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          if (!cancelled) {
            setError(data?.error || 'Unable to load submissions.');
          }
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setSubmissions(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setError('Unable to load submissions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <section className='w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-[#172033] shadow-sm'>
        <p className='p-5 text-sm text-gray-500'>Loading submissions...</p>
      </section>
    );
  }

  return (
    <section className='w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-[#172033] shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-5 py-4'>
        <div>
          <div className='flex items-center gap-2'>
            <Mail className='h-4 w-4 text-emerald-800' />
            <h2 className='text-xl font-semibold'>Lead submissions</h2>
          </div>
          <p className='mt-1 text-sm text-gray-500'>All collected form entries from this project.</p>
        </div>
        <div className='rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600'>
          {submissions.length} {submissions.length === 1 ? 'lead' : 'leads'}
        </div>
      </div>

      {error && <div role='alert' className='mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</div>}

      {submissions.length === 0 ? (
        <div className='p-5'>
          <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center'>
            <FileText className='mx-auto h-8 w-8 text-gray-400' />
            <p className='mt-3 text-sm text-gray-600'>No submissions yet.</p>
            <p className='mt-1 text-xs text-gray-500'>Published forms on your site will appear here automatically.</p>
          </div>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full text-left'>
            <thead className='bg-gray-50'>
              <tr className='border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500'>
                <th className='px-4 py-3 font-semibold'>Lead</th>
                <th className='px-4 py-3 font-semibold'>Form</th>
                <th className='px-4 py-3 font-semibold'>Page</th>
                <th className='px-4 py-3 font-semibold'>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(submission => {
                const primaryField = Object.entries(submission.fields || {}).find(([key]) => /email|mail/i.test(key))?.[1];
                const detailFields = Object.entries(submission.fields || {})
                  .filter(([key]) => !/email|mail/i.test(key))
                  .slice(0, 3);

                return (
                  <tr key={submission.id} className='border-b border-gray-100 text-sm last:border-b-0'>
                    <td className='px-4 py-3 align-top'>
                      <div className='flex items-start gap-3'>
                        <div className='mt-0.5 rounded-md bg-emerald-50 p-2 text-emerald-800'>
                          <Mail className='h-3.5 w-3.5' />
                        </div>
                        <div>
                          <div className='font-medium text-[#172033]'>{formatValue(primaryField || Object.values(submission.fields || {})[0] || 'No value')}</div>
                          {detailFields.length > 0 && (
                            <div className='mt-2 space-y-1 text-xs text-gray-600'>
                              {detailFields.map(([key, value]) => <div key={key}><span className='text-gray-400'>{key}:</span> {formatValue(value)}</div>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-4 py-3 align-top'>
                      <div className='inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600'>
                        <ArrowUpRight className='h-3 w-3 text-gray-400' />
                        {submission.form_id}
                      </div>
                    </td>
                    <td className='px-4 py-3 align-top text-xs text-gray-600'>
                      {submission.page_id || 'unknown'}
                    </td>
                    <td className='px-4 py-3 align-top text-xs text-gray-600'>
                      <div className='flex items-center gap-2 whitespace-nowrap'>
                        <CalendarDays className='h-3.5 w-3.5 text-gray-400' />
                        {new Date(submission.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
