"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import DepositModal from "@/components/portfolio/deposit-modal";
import WithdrawModal from "@/components/portfolio/withdraw-modal";
import SearchModal from "@/components/common/search-modal";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { useWalletBalance } from "@/hooks/useWalletBalance";

const menuItems = [
  { label: "Trenches", path: "/trenches" },
  { label: "Trending", path: "/trending" },
  { label: "CopyTrade", path: "/copy-trade" },
  { label: "Monitor", path: "/monitor" },
  { label: "Track", path: "/track" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Rewards", path: "/rewards" },
];

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { selectedChainId, setSelectedChainId } = useUIStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Fetch wallet balance (hook will handle auth check internally)
  const { balances, totalUsdValue, isLoading: isLoadingBalance } = useWalletBalance();

  // Get SOL balance for display
  const solBalance = balances.find(b => b.chain_id === 501);
  const displayBalance = isLoadingBalance ? '...' : (solBalance ? solBalance.formattedBalance.toFixed(4) : '0');
  const displayUsdValue = isLoadingBalance ? '...' : totalUsdValue.toFixed(2);

  console.log('[TopBar] Wallet balance data:', { 
    isAuthenticated, 
    balances, 
    solBalance, 
    displayBalance, 
    displayUsdValue,
    isLoadingBalance 
  });

  const handleLogout = async () => {
    try {
      // Direct call to backend (CORS now handled by backend)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${useAuthStore.getState().token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuth();
      router.push("/");
      window.location.reload();
    }
  };

  // Close wallet dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showWalletDropdown) {
        const target = event.target as Element;
        if (!target.closest('[data-wallet-dropdown]')) {
          setShowWalletDropdown(false);
        }
      }
      if (showNetworkDropdown) {
        const target = event.target as Element;
        if (!target.closest('[data-network-dropdown]')) {
          setShowNetworkDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWalletDropdown, showNetworkDropdown]);

  // Keyboard shortcut for search (/)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !showSearchModal) {
        event.preventDefault();
        setShowSearchModal(true);
      }
      if (event.key === 'Escape' && showSearchModal) {
        setShowSearchModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSearchModal]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between gap-x-4 relative" style={{ backgroundColor: 'rgb(12, 12, 15)' }}>
      {/* Left Section - Logo and Navigation */}
      <div className="flex-1 min-w-0 flex items-center gap-x-4 pl-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="cursor-pointer w-[120px] h-[32px] flex-shrink-0">
            <div className="text-2xl font-bold text-white" data-testid="logo-gmgn">
              BingoBit
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex items-center gap-x-1 whitespace-nowrap">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <div className={`cursor-pointer text-sm font-medium transition-colors px-1.5 h-7 rounded-md flex items-center ${
                  pathname === item.path 
                    ? 'text-white bg-gray-800' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}>
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section - Search, Actions, Auth */}
      <div className="w-fit h-[48px] flex items-center justify-end pr-3 pl-2">
        <div className="flex gap-2">
          {/* Search Input */}
          <div className="max-w-full w-[224px]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search name, CA, wallet"
                className="h-8 pl-8 pr-10 text-xs bg-gray-800 border-gray-700 text-white placeholder-gray-400 cursor-pointer"
                style={{ backgroundColor: 'rgb(31, 32, 36)', borderColor: 'rgb(39, 40, 46)' }}
                onFocus={() => setShowSearchModal(true)}
                readOnly
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center whitespace-nowrap rounded bg-gray-700 text-gray-300 text-xs font-medium">
                /
              </div>
            </div>
          </div>
        </div>
        {/* Network Selector and Icons */}
        <div className="flex gap-4 mx-4">
          {/* Network Selector Dropdown */}
          <div className="relative" data-network-dropdown>
            <button 
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            >
              {selectedChainId === 501 ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                    <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                    <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                  </svg>
                  <span className="text-sm font-normal text-gray-300">SOL</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" className="text-yellow-400">
                    <path d="M16 0c8.837 0 16 7.163 16 16s-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0zm-3.884 9.116L8.232 16l3.884 6.884L16 25.768l3.884-2.884L23.768 16l-3.884-6.884L16 6.232l-3.884 2.884z"/>
                  </svg>
                  <span className="text-sm font-normal text-gray-300">BSC</span>
                </>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className={`text-gray-400 transition-transform ${showNetworkDropdown ? 'rotate-180' : ''}`}>
                <path d="M1.9152 4.2565a.7.7 0 0 1 .99 0l3.505 3.505 3.505-3.505a.7.7 0 0 1 .99.99l-4.495 4.495-4.495-4.495a.7.7 0 0 1 0-.99"></path>
              </svg>
            </button>

            {/* Network Dropdown Menu */}
            {showNetworkDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-xl border z-50" style={{ backgroundColor: 'rgb(31, 32, 36)', borderColor: 'rgb(39, 40, 46)' }}>
                <div className="p-2">
                  {/* SOL Option */}
                  <button
                    onClick={() => {
                      setSelectedChainId(501);
                      setShowNetworkDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedChainId === 501 ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                    </svg>
                    <span className="text-sm text-gray-300 flex-1 text-left">Solana</span>
                    {selectedChainId === 501 && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-green-400">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    )}
                  </button>

                  {/* BSC Option */}
                  <button
                    onClick={() => {
                      setSelectedChainId(0);
                      setShowNetworkDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedChainId === 0 ? 'bg-gray-700' : 'hover:bg-gray-700'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" className="text-yellow-400">
                      <path d="M16 0c8.837 0 16 7.163 16 16s-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0zm-3.884 9.116L8.232 16l3.884 6.884L16 25.768l3.884-2.884L23.768 16l-3.884-6.884L16 6.232l-3.884 2.884z"/>
                    </svg>
                    <span className="text-sm text-gray-300 flex-1 text-left">BSC</span>
                    {selectedChainId === 0 && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-green-400">
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center justify-end ml-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Wallet Dropdown */}
              <div className="relative" data-wallet-dropdown>
                <button 
                  className="flex bg-gray-800 items-center relative cursor-pointer h-8 w-full rounded-md px-2.5 hover:bg-gray-700 transition-colors"
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  style={{ backgroundColor: 'rgb(31, 32, 36)', borderColor: 'rgb(39, 40, 46)' }}
                >
                  <div className="flex flex-1 items-center">
                    <div className="flex flex-1 items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-gray-300">
                        <path d="M13.7354 5.763a.3.3 0 0 0-.2999-.2997H3.0635c-.2821 0-.551-.0556-.7988-.1524v8.0264c0 .1657.134.3008.2997.3008h10.8711a.301.301 0 0 0 .2999-.3008zm-2.6397 2.832a.7003.7003 0 0 1 .7002.7003.7.7 0 0 1-.7002.6992H8.916a.7.7 0 0 1-.7002-.6992.7004.7004 0 0 1 .7002-.7002zm4.0391 4.7423c0 .9387-.7606 1.6999-1.6993 1.7002H2.5645c-.939 0-1.7002-.7613-1.7002-1.7002V3.264C.8643 1.993 1.895.9623 3.166.9623h7.9297a.7003.7003 0 0 1 .7002.7002.7003.7003 0 0 1-.7002.7002H3.166a.9013.9013 0 0 0-.9013.9013c0 .4413.3575.7988.7988.7989h10.372c.9387.0002 1.6992.7615 1.6993 1.7002z"></path>
                      </svg>
                    </div>
                    <div className="flex-1 ml-1.5">
                      <div className="flex flex-1 h-4 gap-x-2.5">
                        <div className="flex items-center gap-x-1.5">
                          <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                            <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                            <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                          </svg>
                          <div className="flex items-baseline">
                            <span className="text-[13px] text-gray-300">{displayBalance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-2 text-gray-400 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className={`transform transition-transform ${showWalletDropdown ? 'rotate-180' : ''}`}>
                        <path d="M1.797 6.116a.7004.7004 0 0 1 0-.9902.7005.7005 0 0 1 .9903 0L8 10.3387l5.2129-5.2129a.7007.7007 0 0 1 .9903 0 .7007.7007 0 0 1 0 .9903l-5.708 5.708a.7005.7005 0 0 1-.9903 0z"></path>
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Wallet Dropdown Menu */}
                {showWalletDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-lg shadow-xl border z-50" style={{ backgroundColor: 'rgb(31, 32, 36)', borderColor: 'rgb(39, 40, 46)' }}>
                    {/* Header */}
                    <div className="p-4 border-b" style={{ borderColor: 'rgb(39, 40, 46)' }}>
                      <div className="text-sm text-gray-400 mb-1">SOL Balance</div>
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                          <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                          <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                          <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                        </svg>
                        <span className="text-lg font-medium text-white">{displayBalance}</span>
                        <span className="text-sm text-gray-400">${displayUsdValue}</span>
                      </div>
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="p-4 border-b" style={{ borderColor: 'rgb(39, 40, 46)' }}>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {/* First Row */}
                        <button 
                          onClick={() => {
                            setShowDepositModal(true);
                            setShowWalletDropdown(false);
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                              <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                            </svg>
                          </div>
                          <span className="text-xs text-gray-300">Deposit</span>
                        </button>

                        <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                              <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                            </svg>
                          </div>
                          <span className="text-xs text-gray-300">Buy</span>
                        </button>

                        <button 
                          onClick={() => {
                            setShowWithdrawModal(true);
                            setShowWalletDropdown(false);
                          }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                              <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                            </svg>
                          </div>
                          <span className="text-xs text-gray-300">Withdraw</span>
                        </button>

                        <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                              <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                            </svg>
                          </div>
                          <span className="text-xs text-gray-300">Consolidate</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Second Row */}
                        <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                              <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                            </svg>
                          </div>
                          <span className="text-xs text-gray-300">Distribute</span>
                        </button>

                        <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                              <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                            </svg>
                          </div>
                          <span className="text-xs text-gray-300">Transfer</span>
                        </button>

                        <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                              <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                            </svg>
                          </div>
                          <span className="text-xs text-gray-300">Convert</span>
                        </button>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          router.push('/portfolio');
                          setShowWalletDropdown(false);
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
                            <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                          </svg>
                          <span className="text-sm text-gray-300">Portfolio</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-gray-500">
                          <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"></path>
                        </svg>
                      </button>

                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
                            <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                          </svg>
                          <span className="text-sm text-gray-300">Security</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs text-red-400">Not Bound</span>
                          </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-gray-500">
                          <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"></path>
                        </svg>
                      </button>

                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
                            <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                          </svg>
                          <span className="text-sm text-gray-300">Referral</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-gray-500">
                          <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"></path>
                        </svg>
                      </button>

                      {/* GMGN Contest Banner */}
                      <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="rgb(134, 217, 159)">
                            <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                          </svg>
                          <span className="text-sm font-medium text-green-400">GMGN Contest S9</span>
                        </div>
                      </div>

                      {/* Disconnect Button */}
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 mt-2 rounded-lg hover:bg-red-500/10 transition-colors border-t" 
                        style={{ borderColor: 'rgb(39, 40, 46)' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-red-400">
                          <path d="M8 1a.75.75 0 0 1 .75.75v6.5h6.5a.75.75 0 0 1 0 1.5h-6.5v6.5a.75.75 0 0 1-1.5 0v-6.5h-6.5a.75.75 0 0 1 0-1.5h6.5v-6.5A.75.75 0 0 1 8 1z"></path>
                        </svg>
                        <span className="text-sm text-red-400">Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2.5 w-[164px]">
              <button
                onClick={() => setShowSignup(true)}
                className="whitespace-nowrap text-center rounded-md cursor-pointer transition-all duration-100 ease-in-out select-none touch-manipulation px-4 py-2 relative inline-flex items-center justify-center font-semibold text-white rounded-md h-8 text-xs min-w-[85px] px-2 lg:px-4"
                style={{ 
                  backgroundColor: 'rgb(31, 32, 36)', 
                  border: '1px solid rgb(31, 32, 36)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(35, 37, 41)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(31, 32, 36)';
                }}
                data-testid="button-signup"
              >
                <span>Sign Up</span>
              </button>

              <button
                onClick={() => setShowLogin(true)}
                className="whitespace-nowrap text-center rounded-md cursor-pointer transition-all duration-100 ease-in-out select-none touch-manipulation px-4 py-2 relative inline-flex items-center justify-center font-semibold text-black rounded-md h-8 text-xs min-w-[85px] px-2 lg:px-4"
                style={{ 
                  backgroundColor: 'white', 
                  border: '1px solid white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                data-testid="button-login"
              >
                <span>Log In</span>
              </button>
            </div>
          )}

          {showSignup && (
            <Modal onClose={() => setShowSignup(false)} size="narrow">
              <SignupForm />
            </Modal>
          )}

          {showLogin && (
            <Modal onClose={() => setShowLogin(false)}>
              <LoginForm />
            </Modal>
          )}

          {showResetPassword && (
            <Modal onClose={() => setShowResetPassword(false)}>
              <ResetPasswordForm onClose={() => setShowResetPassword(false)} />
            </Modal>
          )}

          {/* Deposit Modal */}
          <DepositModal 
            isOpen={showDepositModal} 
            onClose={() => setShowDepositModal(false)} 
          />

          {/* Withdraw Modal */}
          <WithdrawModal 
            isOpen={showWithdrawModal} 
            onClose={() => setShowWithdrawModal(false)} 
          />

          {/* Search Modal */}
          <SearchModal 
            isOpen={showSearchModal} 
            onClose={() => setShowSearchModal(false)} 
          />
        </div>
      </div>
    </header>
  );
}
