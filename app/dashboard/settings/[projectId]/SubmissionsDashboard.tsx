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
      <div className='rounded-3xl border border-gray-800 bg-[#111214] p-6'>
        <p className='text-sm text-gray-400'>Loading submissions...</p>
      </div>
    );
  }

  return (
    <div className='mt-8 rounded-3xl border border-gray-800 bg-[#111214] p-6'>
      <div className='mb-5 flex items-center justify-between gap-3'>
        <div>
          <div className='flex items-center gap-2'>
            <Mail className='h-4 w-4 text-blue-300' />
            <h2 className='text-xl font-semibold text-white'>Lead submissions</h2>
          </div>
          <p className='mt-1 text-sm text-gray-400'>All collected form entries from this project.</p>
        </div>
        <div className='rounded-full border border-gray-700 bg-[#0f1218] px-3 py-1.5 text-xs font-medium text-gray-300'>
          {submissions.length} {submissions.length === 1 ? 'lead' : 'leads'}
        </div>
      </div>

      {error && <div className='mb-4 rounded-xl border border-red-700 bg-red-950/20 p-4 text-sm text-red-200'>{error}</div>}

      {submissions.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-gray-700 bg-[#0f1218] p-8 text-center'>
          <FileText className='mx-auto h-8 w-8 text-gray-500' />
          <p className='mt-3 text-sm text-gray-400'>No submissions yet.</p>
          <p className='mt-1 text-xs text-gray-500'>Published forms on your site will appear here automatically.</p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full border-separate border-spacing-y-2 text-left'>
            <thead>
              <tr className='text-xs uppercase tracking-wider text-gray-500'>
                <th className='px-3 py-2'>Lead</th>
                <th className='px-3 py-2'>Form</th>
                <th className='px-3 py-2'>Page</th>
                <th className='px-3 py-2'>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(submission => {
                const primaryField = Object.entries(submission.fields || {}).find(([key]) => /email|mail/i.test(key))?.[1];
                const detailFields = Object.entries(submission.fields || {})
                  .filter(([key]) => !/email|mail/i.test(key))
                  .slice(0, 3);

                return (
                  <tr key={submission.id} className='rounded-2xl bg-[#0f1218] text-sm text-gray-200'>
                    <td className='rounded-l-2xl px-3 py-3 align-top'>
                      <div className='flex items-start gap-3'>
                        <div className='mt-0.5 rounded-full bg-blue-500/10 p-2 text-blue-300'>
                          <Mail className='h-3.5 w-3.5' />
                        </div>
                        <div>
                          <div className='font-medium text-white'>{formatValue(primaryField || Object.values(submission.fields || {})[0] || 'No value')}</div>
                          {detailFields.length > 0 && (
                            <div className='mt-2 space-y-1 text-xs text-gray-400'>
                              {detailFields.map(([key, value]) => (
                                <div key={key}><span className='text-gray-500'>{key}:</span> {formatValue(value)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='px-3 py-3 align-top'>
                      <div className='inline-flex items-center gap-2 rounded-full border border-gray-700 bg-[#111214] px-2.5 py-1 text-xs text-gray-300'>
                        <ArrowUpRight className='h-3 w-3 text-gray-500' />
                        {submission.form_id}
                      </div>
                    </td>
                    <td className='px-3 py-3 align-top text-xs text-gray-400'>
                      {submission.page_id || 'unknown'}
                    </td>
                    <td className='rounded-r-2xl px-3 py-3 align-top text-xs text-gray-400'>
                      <div className='flex items-center gap-2'>
                        <CalendarDays className='h-3.5 w-3.5 text-gray-500' />
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
    </div>
  );
}
