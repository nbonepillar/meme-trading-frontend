import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    console.log('[WalletBalance API] Sending request to:', `${API_BASE_URL}/api/wallet/balance`);
    console.log('[WalletBalance API] Auth header:', authHeader);
    
    const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log('[WalletBalance API] Backend response status:', response.status);
    
    const data = await response.json();
    console.log('[WalletBalance API] Backend response data:', data);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Failed to fetch balance' },
        { status: response.status }
      );
    }

    // Backend uses status: 0 for success
    if (data.status === 0) {
      return NextResponse.json({
        success: true,
        balances: data.data?.balances || [],
        message: data.message
      });
    } else {
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to fetch balance' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[WalletBalance API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}