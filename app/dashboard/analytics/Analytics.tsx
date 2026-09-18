'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Globe2,
  MoreHorizontal,
  Rocket,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsProject {
  id: string;
  title: string;
  status: string;
  updated_at: Date | string;
  vercelUrl?: string;
}

interface AnalyticsProps {
  projects: AnalyticsProject[];
}

const activityDays = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 46 },
  { label: 'Thu', value: 72 },
  { label: 'Fri', value: 64 },
  { label: 'Sat', value: 38 },
  { label: 'Sun', value: 51 },
];

const formatRelativeDate = (date: Date | string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

export default function Analytics({ projects }: AnalyticsProps) {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');
  const publishedProjects = projects.filter(project => project.status?.toLowerCase() === 'published');
  const draftProjects = projects.length - publishedProjects.length;
  const recentlyUpdated = useMemo(
    () => [...projects].sort((first, second) => new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime()).slice(0, 5),
    [projects],
  );
  const peakActivity = Math.max(...activityDays.map(day => day.value));

  const metrics = [
    { label: 'Total projects', value: projects.length, change: '+12.5%', detail: 'vs. previous period', icon: Globe2, tone: 'bg-sky-50 text-sky-600', positive: true },
    { label: 'Published sites', value: publishedProjects.length, change: '+8.2%', detail: 'vs. previous period', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600', positive: true },
    { label: 'Draft projects', value: draftProjects, change: '-4.1%', detail: 'vs. previous period', icon: Clock3, tone: 'bg-amber-50 text-amber-600', positive: false },
    { label: 'Workspace activity', value: '84%', change: '+18.4%', detail: 'engagement score', icon: TrendingUp, tone: 'bg-violet-50 text-violet-600', positive: true },
  ];

  return (
    <section className="space-y-8" aria-labelledby="analytics-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            <BarChart3 size={15} /> Workspace analytics
          </div>
          <h1 id="analytics-heading" className="mt-2 text-3xl font-semibold tracking-tight text-[#102022]">Understand your momentum</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">A focused view of project health, publishing progress, and activity across your workspace.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm" role="group" aria-label="Analytics time range">
          {(['7d', '30d', '90d'] as const).map(option => (
            <button key={option} type="button" onClick={() => setRange(option)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${range === option ? 'bg-[#102022] text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
              {option === '7d' ? 'Last 7 days' : option === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => (
          <article key={metric.label} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">{metric.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-[#102022]">{metric.value}</p></div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon size={19} /></div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs"><span className={metric.positive ? 'text-emerald-600' : 'text-amber-600'}>{metric.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{metric.change}</span><span className="text-gray-400">{metric.detail}</span></div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between"><div><h2 className="font-semibold text-[#102022]">Workspace activity</h2><p className="mt-1 text-sm text-gray-500">Project edits and publishing actions</p></div><button type="button" aria-label="More activity options" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><MoreHorizontal size={18} /></button></div>
          <div className="mt-8 flex h-52 items-end gap-3 sm:gap-5">
            {activityDays.map(day => <div key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-3"><div className="relative flex w-full max-w-10 flex-1 items-end"><div className="w-full rounded-t-lg bg-emerald-400 transition-all hover:bg-emerald-500" style={{ height: `${(day.value / peakActivity) * 100}%` }} title={`${day.value} actions`} /></div><span className="text-xs font-medium text-gray-400">{day.label}</span></div>)}
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Activity is trending upward this period</div>
        </article>

        <article className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between"><div><h2 className="font-semibold text-[#102022]">Project health</h2><p className="mt-1 text-sm text-gray-500">Current publishing distribution</p></div><Rocket className="text-emerald-500" size={20} /></div>
          <div className="mt-8 flex items-center gap-6"><div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#34d399 ${projects.length ? (publishedProjects.length / projects.length) * 360 : 0}deg, #fbbf24 0deg)` }}><div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white"><span className="text-2xl font-semibold text-[#102022]">{projects.length ? Math.round((publishedProjects.length / projects.length) * 100) : 0}%</span><span className="text-[10px] uppercase tracking-wider text-gray-400">published</span></div></div><div className="space-y-4 text-sm"><div><div className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Published <strong className="ml-auto text-[#102022]">{publishedProjects.length}</strong></div></div><div><div className="flex items-center gap-2 text-gray-600"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Draft <strong className="ml-auto text-[#102022]">{draftProjects}</strong></div></div></div></div>
          <div className="mt-8 rounded-xl bg-[#f5f7fb] p-4 text-sm text-gray-600">{draftProjects > 0 ? `${draftProjects} project${draftProjects === 1 ? '' : 's'} ready for your next publishing pass.` : 'Every project is currently published. Nice work.'}</div>
        </article>
      </div>

      <article className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5"><div><h2 className="font-semibold text-[#102022]">Recently updated</h2><p className="mt-1 text-sm text-gray-500">Your latest project activity</p></div><span className="text-xs font-semibold text-gray-400">{range === '7d' ? 'This week' : range === '30d' ? 'This month' : 'This quarter'}</span></div>
        {recentlyUpdated.length > 0 ? <div className="divide-y divide-gray-100">{recentlyUpdated.map(project => <div key={project.id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><Globe2 size={16} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#102022]">{project.title}</p><p className="text-xs text-gray-400">Updated {formatRelativeDate(project.updated_at)}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${project.status?.toLowerCase() === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{project.status?.toLowerCase() === 'published' ? 'Published' : 'Draft'}</span></div>)}</div> : <div className="px-6 py-12 text-center text-sm text-gray-500">Create a project to start seeing workspace activity.</div>}
      </article>
    </section>
  );
}
