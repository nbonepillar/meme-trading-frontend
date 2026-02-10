import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get Authorization header from the request
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    
    if (!body.chain_id || !body.to_wallet || !body.amount) {
      return NextResponse.json(
        { error: 'chain_id, to_wallet, and amount are required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const backendUrl = 'http://192.168.1.47:8080/api/wallet/withdraw';
    
    console.log('Forwarding withdraw request to:', backendUrl);
    console.log('Request body:', body);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);

    // Always try to parse the response body first
    const responseText = await response.text();
    console.log('Backend response body:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from backend' },
        { status: 500 }
      );
    }

    // Check if the response body indicates success, regardless of HTTP status
    if (data.status === 0 && data.data?.success) {
      console.log('Backend response data (success):', data);
      return NextResponse.json(data);
    } else {
      console.error('Backend returned error in response body:', data);
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('Withdraw API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}