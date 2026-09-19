export interface GeneratedCmsCollection {
  name: string;
  slug: string;
  fields: string[];
  data: Record<string, string>;
}

const titleFromSlug = (slug: string) => slug.split('-').filter(Boolean).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'CMS Collection';

export const extractGeneratedCmsCollections = (html: string): GeneratedCmsCollection[] => {
  if (typeof document === 'undefined') return [];
  const container = document.createElement('div');
  container.innerHTML = html;
  const collections = new Map<string, GeneratedCmsCollection>();

  container.querySelectorAll('[data-lunio-cms-map="true"]').forEach(map => {
    const slug = String(map.getAttribute('data-cms-collection') || '').trim().toLowerCase();
    if (!slug) return;
    const collection = collections.get(slug) || { name: titleFromSlug(slug), slug, fields: [], data: {} };
    const shopCheckout = map.querySelector('[data-lunio-shop-checkout="true"]');
    if (shopCheckout) {
      for (const field of ['data-shop-name-field', 'data-shop-price-field', 'data-shop-image-field']) {
        const value = shopCheckout.getAttribute(field);
        if (value && !collection.fields.includes(value)) collection.fields.push(value);
      }
    }
    map.querySelectorAll('[data-cms-field], [data-cms-href-field], [data-cms-alt-field]').forEach(node => {
      const field = node.getAttribute('data-cms-field') || node.getAttribute('data-cms-href-field') || node.getAttribute('data-cms-alt-field');
      if (!field) return;
      if (!collection.fields.includes(field)) collection.fields.push(field);
      const value = node.getAttribute('data-cms-href-field') ? node.getAttribute('href') : node.getAttribute('data-cms-alt-field') ? node.getAttribute('alt') : node.getAttribute('data-cms-field') && node.tagName.toLowerCase() === 'img' ? node.getAttribute('src') : node.textContent?.trim();
      if (value) collection.data[field] = value;
    });
    collections.set(slug, collection);
  });

  return Array.from(collections.values());
};

export const persistGeneratedCms = async (projectId: string, html: string): Promise<void> => {
  const collections = extractGeneratedCmsCollections(html);
  await Promise.all(collections.map(collection => fetch(`/api/cms/${encodeURIComponent(projectId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'seed', ...collection }),
  })));
};