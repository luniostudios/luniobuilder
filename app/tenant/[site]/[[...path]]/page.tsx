import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseServer } from '../../../lib/supabaseServer';
import { normalizeSiteSlug } from '../../../lib/tenant';
import TenantSite from '../../TenantSite';
import type { Page } from '../../../types/builder';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TenantRouteProps {
	params: Promise<{
		site: string;
		path?: string[];
	}>;
}

interface TenantProject {
	id: string;
	title: string;
	site_slug: string;
	status: string;
	content: {
		pages?: Page[];
		currentPageId?: string;
	} | null;
}

const getRequestedSlug = (path: string[] | undefined) => {
	if (!path || path.length === 0) return '/';
	return `/${path.join('/')}`.replace(/\/+$/, '') || '/';
};

const findPage = (pages: Page[], requestedSlug: string) => {
	const normalizedRequestedSlug = requestedSlug === '/' ? '/' : requestedSlug.replace(/^\/+/, '');
	const matchingPage = pages.find(page => {
		const pageSlug = page.slug === '/' ? '/' : page.slug.replace(/^\/+/, '').replace(/\/+$/, '');
		return pageSlug === normalizedRequestedSlug || (normalizedRequestedSlug === '/' && pageSlug === 'home');
	});

	return matchingPage || (normalizedRequestedSlug === '/' ? pages[0] : undefined);
};

async function getTenantProject(site: string) {
	const siteSlug = normalizeSiteSlug(site);
	if (!siteSlug) return null;

	const { data, error } = await supabaseServer
		.from('projects')
		.select('id, title, site_slug, status, content')
		.eq('site_slug', siteSlug)
		.eq('status', 'published')
		.maybeSingle();

	if (error) throw new Error(error.message);
	return data as TenantProject | null;
}

export async function generateMetadata({ params }: TenantRouteProps): Promise<Metadata> {
	const { site, path } = await params;
	const project = await getTenantProject(site);
	const pages = project?.content?.pages || [];
	const page = findPage(pages, getRequestedSlug(path));

	if (!project || !page) return {};

	return {
		title: page.seo?.title || project.title,
		description: page.seo?.description || undefined,
		keywords: page.seo?.keywords || undefined,
	};
}

export default async function TenantPage({ params }: TenantRouteProps) {
	const { site, path } = await params;
	const project = await getTenantProject(site);
	const pages = project?.content?.pages || [];
	const page = findPage(pages, getRequestedSlug(path));

	if (!project || !page) notFound();

	return (
		<TenantSite
			projectId={project.id}
			projectName={project.title}
			pages={pages}
			currentPageId={page.id}
		/>
	);
}



