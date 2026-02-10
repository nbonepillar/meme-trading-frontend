import { useAuthStore } from '@/store/authStore';

interface SignupData {
  email: string;
  password: string;
  username?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
  oldpassword: string;
  newpassword: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class AuthAPI {
  private getAuthHeaders(): HeadersInit {
    const token = useAuthStore.getState().getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async signup(data: SignupData): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return { success: result.success, data: result, error: result.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async login(data: LoginData): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/user/sign_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success && result.token) {
        useAuthStore.getState().setAuth(result.token, result.user);
      }
      
      return { success: result.success, data: result, error: result.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      // Direct call to backend (CORS now handled by backend)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success) {
        useAuthStore.getState().clearAuth();
      }
      
      return { success: result.success, data: result, error: result.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return { success: result.success, data: result, error: result.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

export const authAPI = new AuthAPI();
