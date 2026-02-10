import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chain_id');
    
    if (!chainId) {
      return NextResponse.json(
        { error: 'chain_id parameter is required' },
        { status: 400 }
      );
    }

    // Get Authorization header from the request
    const authorization = request.headers.get('authorization');
    
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Create URLSearchParams for the backend request
    const params = new URLSearchParams({
      chain_id: chainId
    });

    // Forward the request to the backend with params
    const backendUrl = `http://192.168.1.47:8080/api/wallet/deposit?${params.toString()}`;
    
    console.log('Forwarding request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
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
    if (data.status === 200 && data.data?.wallet_address) {
      console.log('Backend response data (success):', data);
      return NextResponse.json(data);
    } else {
      console.error('Backend returned error in response body:', data);
      return NextResponse.json(
        { error: data.message || 'Backend error' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}