import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.47:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Login API] Attempting login for:', body.email);
    
    // Call backend login API
    const response = await fetch(`${API_BASE_URL}/api/user/sign_in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Login API] Backend response status:', response.status);

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[Login API] Backend returned non-JSON response');
      return NextResponse.json(
        {
          success: false,
          error: 'Backend service unavailable or returned invalid response',
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    console.log('[Login API] Backend response data:', data);

    // Backend uses status: 0 for success and token is in data.data.token
    const token = data.data?.token || data.token;
    
    if (response.ok && data.status === 0 && token) {
      console.log('[Login API] Login successful, setting cookie');
      
      // Create response with data
      const nextResponse = NextResponse.json({
        success: true,
        token: token,
        user: data.data?.user || data.user,
        message: data.message || 'Login successful'
      });

      // Set auth_token cookie
      nextResponse.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      console.log('[Login API] Cookie set successfully');

      return nextResponse;
    } else {
      console.error('[Login API] Login failed:', data.message || data.error);
      return NextResponse.json(
        {
          success: false,
          error: data.message || data.error || 'Login failed',
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
