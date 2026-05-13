import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;

    const query = searchParams
      .get('q')
      ?.trim()
      .toLowerCase();

    const limit = parseInt(
      searchParams.get('limit') || '10'
    );

    if (!query || query.length < 2) {
      return NextResponse.json({
        data: [],
      });
    }

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sanitizedQuery = query.replace(
      /[%_,]/g,
      ''
    );

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        username,
        display_name,
        avatar_color,
        avatar_url,
        bio,
        is_online,
        status
        `
      )
      .or(
        `username.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%`
      )
      .neq('id', user.id)
      .limit(
        Math.min(limit, 25)
      );

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: users || [],
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
