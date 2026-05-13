import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { status = 'online', device_type } = await request.json();

    const validStatuses = ['online', 'idle', 'offline', 'dnd'];

    if (
      typeof status !== 'string' ||
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('user_presence')
      .upsert(
        {
          user_id: user.id,
          status,
          device_type:
            typeof device_type === 'string'
              ? device_type
              : null,
          last_heartbeat: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: 'Failed to update presence' },
        { status: 500 }
      );
    }

    await supabase
      .from('user_profiles')
      .update({
        is_online: status !== 'offline',
        status,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json(
      { data },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
