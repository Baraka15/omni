import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    const { status = 'online', device_type } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validStatuses = ['online', 'idle', 'offline', 'dnd'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Upsert presence
    const { data, error } = await supabase
      .from('user_presence')
      .upsert(
        {
          user_id: user.id,
          status,
          device_type,
          last_heartbeat: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Update user profile
    await supabase
      .from('user_profiles')
      .update({
        is_online: status === 'online',
        status,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
