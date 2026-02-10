import { AuthStatus } from '@/components/auth/AuthStatus';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Your App
            </Link>
            <div className="hidden md:flex gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/trade" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Trade
              </Link>
            </div>
          </div>
          
          <AuthStatus />
        </div>
      </div>
    </nav>
  );
}
