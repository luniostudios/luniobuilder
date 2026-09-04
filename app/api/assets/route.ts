import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';

const BUCKET = 'user-assets';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']);

const getUser = async () => {
  const session = await auth();
  const userId = session?.user?.id || session?.user?.email;
  return userId ? String(userId) : null;
};

const getUserFolder = (userId: string) => userId.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET() {
  const userId = await getUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer.storage.from(BUCKET).list(getUserFolder(userId), {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assets = (data || [])
    .filter((file) => file.name && file.metadata?.mimetype?.startsWith('image/'))
    .map((file) => {
      const path = `${getUserFolder(userId)}/${file.name}`;
      const { data: publicUrl } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);
      return { id: path, name: file.name, url: publicUrl.publicUrl };
    });

  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const userId = await getUser();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'An image file is required.' }, { status: 400 });
  }
  if (!IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only image files are supported.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Images must be 10 MB or smaller.' }, { status: 400 });
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${getUserFolder(userId)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseServer.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: publicUrl } = supabaseServer.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({
    asset: { id: path, name: file.name, url: publicUrl.publicUrl },
  });
}
