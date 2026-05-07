import { NextRequest, NextResponse } from 'next/server';

type UnsplashSearchResult = {
  id: string;
  width: number;
  height: number;
  color: string | null;
  blur_hash?: string;
  alt_description: string | null;
  description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
};

export async function GET(req: NextRequest) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json(
      { error: 'Unsplash access key not configured (UNSPLASH_ACCESS_KEY)' },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1);
  const perPage = Math.min(30, Math.max(1, Number(url.searchParams.get('perPage') || 12) || 12));

  if (!q) {
    return NextResponse.json({ results: [], total: 0, total_pages: 0 });
  }

  const upstream = new URL('https://api.unsplash.com/search/photos');
  upstream.searchParams.set('query', q);
  upstream.searchParams.set('page', String(page));
  upstream.searchParams.set('per_page', String(perPage));
  upstream.searchParams.set('content_filter', 'high');

  const res = await fetch(upstream.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
    // Keep traffic fresh while still allowing CDN caching.
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      { error: `Unsplash request failed (${res.status})`, details: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    total: number;
    total_pages: number;
    results: UnsplashSearchResult[];
  };

  const normalized = {
    total: data.total,
    total_pages: data.total_pages,
    results: (data.results || []).map((p) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      color: p.color ?? null,
      blur_hash: p.blur_hash,
      alt_description: p.alt_description ?? null,
      description: p.description ?? null,
      urls: p.urls,
      user: p.user,
      links: p.links,
    })),
  };

  return NextResponse.json(normalized);
}

