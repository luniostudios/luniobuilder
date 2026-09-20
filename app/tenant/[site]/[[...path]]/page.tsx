import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '../../../lib/supabaseServer';
import { normalizeSiteSlug } from '../../../lib/tenant';
import TenantSite from '../../TenantSite';
import type { Page } from '../../../types/builder';
import type { CmsRecord } from '../../../types/cms';
import { siteAccessCookieName } from '../../../lib/siteAccess';

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

const normalizeRoutePart = (value: string) => value.toLowerCase().replace(/^\/+|\/+$/g, '');

async function findCmsDetail(projectId: string, pages: Page[], requestedSlug: string) {
	const routeParts = normalizeRoutePart(requestedSlug).split('/').filter(Boolean);
	if (routeParts.length !== 2) return null;
	const page = pages.find(candidate => candidate.cmsDetail?.enabled && candidate.slug !== '/' && normalizeRoutePart(candidate.slug) === routeParts[0]);
	const settings = page?.cmsDetail;
	if (!page || !settings?.collectionId || !settings.slugField) return null;

	const { data: collection } = await supabaseServer
		.from('cms_collections')
		.select('id, slug')
		.eq('id', settings.collectionId)
		.eq('project_id', projectId)
		.maybeSingle();
	if (!collection) return null;
	const { data: records } = await supabaseServer
		.from('cms_records')
		.select('id, data')
		.eq('collection_id', collection.id);
	const record = (records || []).find(candidate => {
		const storedSlug = normalizeRoutePart(String(candidate.data?.[settings.slugField] || ''));
		return storedSlug === routeParts[1] || storedSlug === routeParts.join('/');
	});
	return record ? { page, record: record as Pick<CmsRecord, 'id' | 'data'> } : null;
}

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
	const requestedSlug = getRequestedSlug(path);
	const page = findPage(pages, requestedSlug) || (project ? (await findCmsDetail(project.id, pages, requestedSlug))?.page : undefined);

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
	const requestedSlug = getRequestedSlug(path);
	const detail = project ? await findCmsDetail(project.id, pages, requestedSlug) : null;
	const page = findPage(pages, requestedSlug) || detail?.page;

	if (!project || !page) notFound();
	const accessCookie = (await cookies()).get(siteAccessCookieName(project.id, page.id));
	const isPageUnlocked = !page.passwordProtected || accessCookie?.value === 'granted';
	const publicPages = pages.map(({ password: _password, ...publicPage }) => publicPage);

	return (
		<TenantSite
			projectId={project.id}
			projectName={project.title}
			pages={publicPages}
			currentPageId={page.id}
			isPageUnlocked={isPageUnlocked}
			cmsRecord={detail?.record}
		/>
	);
}



