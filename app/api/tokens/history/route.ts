import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId');
    const tokenAddress = searchParams.get('tokenAddress');
    const type = searchParams.get('type');
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '50';

    console.log('[History API] Request params:', { chainId, tokenAddress, type, offset, limit });

    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    console.log('[History API] Token found:', !!token);

    if (!token) {
      console.error('[History API] No token found in cookies');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Build query params
    const params = new URLSearchParams();
    if (chainId) params.append('chainId', chainId);
    if (tokenAddress) params.append('tokenAddress', tokenAddress);
    if (type !== null && type !== undefined) params.append('type', type);
    params.append('offset', offset);
    params.append('limit', limit);

    // Make request to backend API
    const url = `${API_BASE_URL}/api/tokens/history?${params.toString()}`;
    console.log('[History API] Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[History API] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[History API] Error response:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch transaction history', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[History API] Success:', {
      transactionsCount: data.transactions?.length || 0,
      total: data.total,
      status: data.status
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[History API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
