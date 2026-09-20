import { createHash } from 'crypto';

export const siteAccessCookieName = (projectId: string, pageId: string) => (
  `lunio_page_access_${createHash('sha256').update(`${projectId}:${pageId}`).digest('hex').slice(0, 32)}`
);