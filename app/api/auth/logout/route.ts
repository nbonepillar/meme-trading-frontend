import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    console.log('[Logout API] Auth header:', authHeader);
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    console.log('[Logout API] Sending to:', `${API_BASE_URL}/rest/logout`);
    
    const response = await fetch(`${API_BASE_URL}/rest/logout`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Logout API] Backend response status:', response.status);
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[Logout API] Backend returned non-JSON response');
      return NextResponse.json(
        { success: false, error: 'Backend service unavailable or returned invalid response' },
        { status: 502 }
      );
    }
    
    const data = await response.json();
    console.log('[Logout API] Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Logout failed' },
        { status: response.status }
      );
    }

    // Create response and clear the auth_token cookie
    const nextResponse = NextResponse.json(data);
    nextResponse.cookies.delete('auth_token');
    console.log('[Logout API] Cookie cleared');

    return nextResponse;
  } catch (error) {
    console.error('[Logout API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
