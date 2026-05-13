import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, count, error } = await supabase
      .from('conversation_summaries')
      .select('*', { count: 'exact' })
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ data, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { other_user_id } = await request.json();

    if (!other_user_id) {
      return NextResponse.json({ error: 'other_user_id required' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      user_a: user.id,
      user_b: other_user_id,
    });

    if (error) throw error;

    return NextResponse.json({ conversation_id: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
