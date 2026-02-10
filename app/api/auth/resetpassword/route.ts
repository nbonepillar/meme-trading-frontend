import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Reset Password API] Request body:', body);
    console.log('[Reset Password API] Sending to:', `${API_BASE_URL}/rest/resetpassword`);
    
    const response = await fetch(`${API_BASE_URL}/rest/resetpassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[Reset Password API] Backend response status:', response.status);
    
    const data = await response.json();
    console.log('[Reset Password API] Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Password reset failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Reset Password API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
