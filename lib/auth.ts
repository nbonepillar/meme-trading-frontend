import { cookies } from "next/headers";

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("refresh_token")?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const accessToken = await getAccessToken();
  return !!accessToken;
}

// Client-side token refresh utility
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
