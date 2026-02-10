import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.47:8080';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '50';

    console.log('[Holdings API] Request params:', { offset, limit });

    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    console.log('[Holdings API] Token found:', !!token);

    if (!token) {
      console.error('[Holdings API] No token found in cookies');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Make request to backend API
    const url = `${API_BASE_URL}/api/tokens/holding?offset=${offset}&limit=${limit}`;
    console.log('[Holdings API] Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Holdings API] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Holdings API] Error response:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch holdings', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Holdings API] Success:', {
      holdingsCount: data.holdings?.length || 0,
      total: data.total,
      status: data.status
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Holdings API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
