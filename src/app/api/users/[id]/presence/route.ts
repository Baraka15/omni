import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(error);

      return NextResponse.json(
        { error: 'Failed to fetch presence' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || {
        user_id: userId,
        status: 'offline',
        last_heartbeat: null,
      },
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
