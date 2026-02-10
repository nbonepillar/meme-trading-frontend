import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string; tokenAddress: string }> }
) {
  try {
    const { chainId, tokenAddress } = await params;
    const { searchParams } = new URL(request.url);
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '50';

    console.log('[Holders API] Request params:', { chainId, tokenAddress, offset, limit });

    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    console.log('[Holders API] Token found:', !!token);

    if (!token) {
      console.error('[Holders API] No token found in cookies');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Make request to backend API
    const url = `${API_BASE_URL}/api/tokens/${chainId}/${tokenAddress}/holders?offset=${offset}&limit=${limit}`;
    console.log('[Holders API] Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Holders API] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Holders API] Error response:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch holders', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Holders API] Success:', {
      holdersCount: data.holders?.length || 0,
      total: data.total,
      status: data.status
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Holders API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
