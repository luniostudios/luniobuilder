import { NextResponse } from 'next/server';
import { auth } from '../../auth/auth';
import { supabaseServer } from '../../lib/supabaseServer';

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id || session.user.email;


    const { data, error } = await supabaseServer
        .from('users')
        .select('*')

    if (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Unable to fetch user data' }, { status: 500 });
    }

    return NextResponse.json(data);
}