import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseServer } from '../../../lib/supabaseServer';
import { normalizeSiteSlug } from '../../../lib/tenant';
import TenantSite from '../../TenantSite';
import type { Page } from '../../../types/builder';
import type { CmsRecord } from '../../../types/cms';
import { siteAccessCookieName } from '../../../lib/siteAccess';
import { normalizeSiteMetadata } from '../../../types/siteMetadata';

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
	favicon_url: string | null;
	socialOg: string | null;
	site_metadata: unknown;
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
		.select('id, title, site_slug, status, content, favicon_url, socialOg, site_metadata')
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
	const siteMetadata = normalizeSiteMetadata(project.site_metadata, project.title);
	const title = page.seo?.title || siteMetadata.title || project.title;
	const description = page.seo?.description || siteMetadata.description || undefined;
	const canonicalUrl = (() => {
		if (!siteMetadata.canonicalUrl) return undefined;
		try {
			const base = new URL(siteMetadata.canonicalUrl);
			const basePath = base.pathname.replace(/\/+$/, '');
			base.pathname = `${basePath}${requestedSlug === '/' ? '' : `/${requestedSlug.replace(/^\/+/, '')}`}` || '/';
			return base.toString();
		} catch {
			return undefined;
		}
	})();
	const openGraphTitle = siteMetadata.openGraphTitle || title;
	const openGraphDescription = siteMetadata.openGraphDescription || description;
	const socialImage = project.socialOg || undefined;

	return {
		title,
		description,
		keywords: page.seo?.keywords || siteMetadata.keywords || undefined,
		alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
		robots: { index: siteMetadata.robotsIndex, follow: siteMetadata.robotsFollow },
		openGraph: {
			title: openGraphTitle,
			description: openGraphDescription,
			type: 'website',
			siteName: siteMetadata.title || project.title,
			url: canonicalUrl,
			locale: siteMetadata.openGraphLocale || undefined,
			images: socialImage ? [{ url: socialImage, alt: siteMetadata.openGraphImageAlt || openGraphTitle }] : undefined,
		},
		twitter: {
			card: siteMetadata.twitterCard,
			title: siteMetadata.twitterTitle || openGraphTitle,
			description: siteMetadata.twitterDescription || openGraphDescription,
			site: siteMetadata.twitterSite || undefined,
			creator: siteMetadata.twitterCreator || undefined,
			images: socialImage ? [socialImage] : undefined,
		},
		other: siteMetadata.themeColor ? { 'theme-color': siteMetadata.themeColor } : undefined,
		icons: project.favicon_url ? { icon: project.favicon_url, shortcut: project.favicon_url, apple: project.favicon_url } : undefined,
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



