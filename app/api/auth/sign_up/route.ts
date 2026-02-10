import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const requestBody = {
      email: body.email,
      password: body.password
    };
    
    console.log('[Signup API] Request body:', requestBody);
    console.log('[Signup API] Sending to:', `${API_BASE_URL}/api/user/sign_up`);
    
    const response = await fetch(`${API_BASE_URL}/api/user/sign_up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Signup API] Backend response status:', response.status);
    
    const data = await response.json();
    console.log('[Signup API] Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Signup failed' },
        { status: response.status }
      );
    }

    // Backend uses status: 0 for success
    if (data.status === 0) {
      return NextResponse.json({
        success: true,
        uuid: data.data?.uuid,
        message: data.message
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || 'Signup failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Signup API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
