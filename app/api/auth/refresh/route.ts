"use server";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const refresh_token = request.cookies.get("refresh_token")?.value;

    if (!refresh_token) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401 }
      );
    }

    // TODO: Verify refresh token
    // const payload = await verifyRefreshToken(refresh_token);

    // Generate new access token
    const access_token = generateAccessToken({ /* user data */ });

    const response = NextResponse.json({
      success: true,
      access_token,
    });

    response.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 401 }
    );
  }
}

function generateAccessToken(payload: any): string {
  return `access_${Date.now()}_${JSON.stringify(payload)}`;
}
