import { NextRequest, NextResponse } from 'next/server';

export interface SellTradeRequest {
  chain_id: number;
  token_address: string;
  amount: string;
}

export interface SellTradeResponse {
  success: boolean;
  trade_id?: string;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SellTradeRequest = await request.json();
    
    // Validate required fields
    if (!body.chain_id || !body.token_address || !body.amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate chain_id (only Solana supported for now)
    if (body.chain_id !== 501) {
      return NextResponse.json(
        { success: false, error: 'Only Solana (chain_id: 501) is supported' },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://192.168.1.47:8080';
    
    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    
    console.log('[Sell API] Sending sell request to backend:', {
      url: `${backendUrl}/api/trade/sell`,
      body,
      hasAuth: !!authHeader
    });

    // Prepare headers for backend request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward request to backend
    const response = await fetch(`${backendUrl}/api/trade/sell`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Sell API] Backend error:', response.status, errorText);
      
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const result: SellTradeResponse = await response.json();
    console.log('[Sell API] Backend response:', result);

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[Sell API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}