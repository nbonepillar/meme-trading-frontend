'use client';

import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/lib/auth-api';
import { useRouter } from 'next/navigation';

export function AuthStatus() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await authAPI.logout();
    router.push('/login');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Login
        </button>
        <button
          onClick={() => router.push('/signup')}
          className="px-4 py-2 text-sm font-medium text-black rounded-md"
          style={{ backgroundColor: 'rgb(134, 217, 159)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(120, 200, 145)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(134, 217, 159)'}
        >
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-700">
        Welcome, {user.username || user.email}
      </span>
      <button
        onClick={handleLogout}
        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Logout
      </button>
    </div>
  );
}
