import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/auth-api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (email: string, password: string, username?: string) => {
    setLoading(true);
    setError(null);
    
    const result = await authAPI.signup({ email, password, username });
    
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Signup failed');
      return false;
    }
    
    return true;
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    const result = await authAPI.login({ email, password });
    
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
      return false;
    }
    
    router.push('/dashboard');
    return true;
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    await authAPI.logout();
    clearAuth();
    
    setLoading(false);
    router.push('/login');
  };

  const resetPassword = async (email: string, oldpassword: string, newpassword: string) => {
    setLoading(true);
    setError(null);
    
    const result = await authAPI.resetPassword({ email, oldpassword, newpassword });
    
    setLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Password reset failed');
      return false;
    }
    
    return true;
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
  };
}
