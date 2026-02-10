import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.uuid || !body.code) {
      return NextResponse.json(
        { success: false, error: 'UUID and code are required' },
        { status: 400 }
      );
    }

    const requestBody = {
      uuid: body.uuid,
      code: body.code
    };
    
    console.log('[VerifyEmail API] Request body:', requestBody);
    console.log('[VerifyEmail API] Sending to:', `${API_BASE_URL}/api/user/verify_email`);
    
    const response = await fetch(`${API_BASE_URL}/api/user/verify_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[VerifyEmail API] Backend response status:', response.status);
    
    const data = await response.json();
    console.log('[VerifyEmail API] Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Verification failed' },
        { status: response.status }
      );
    }

    // Backend uses status: 0 for success
    if (data.status === 0 && data.data?.token) {
      console.log('[VerifyEmail API] Verification successful, setting cookie');
      
      // Create response with data
      const nextResponse = NextResponse.json({
        success: true,
        token: data.data.token,
        message: data.message
      });

      // Set auth_token cookie (same as login)
      nextResponse.cookies.set('auth_token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      console.log('[VerifyEmail API] Cookie set successfully');

      return nextResponse;
    } else {
      return NextResponse.json(
        { success: false, error: data.message || 'Verification failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[VerifyEmail API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}