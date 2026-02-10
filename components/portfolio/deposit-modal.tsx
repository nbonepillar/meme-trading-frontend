'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Copy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';
import { useWalletBalance } from '@/hooks/useWalletBalance';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [activeTab, setActiveTab] = useState('deposit');
  const [selectedWallet] = useState('Wallet1');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const { getToken } = useAuthStore();
  const { toasts, removeToast, success, error } = useToast();
  const { refetch: refetchBalance } = useWalletBalance();

  // Fetch wallet address when modal opens
  useEffect(() => {
    if (isOpen && !walletAddress) {
      fetchWalletAddress();
    }
    
    // Refresh balance when modal opens (user might have deposited)
    if (isOpen) {
      console.log('[DepositModal] Modal opened, refreshing balance');
      refetchBalance();
    }
  }, [isOpen, refetchBalance]);

  const fetchWalletAddress = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const token = getToken();
      if (!token) {
        error('Authentication required');
        setHasError(true);
        return;
      }

      const params = new URLSearchParams({
        chain_id: '501'
      });

      // Direct call to backend (CORS now handled by backend)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.1.47:8080';
      const response = await fetch(`${API_BASE_URL}/api/wallet/deposit?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Deposit API response:', data);
      
      if (data.status === 200 && data.data?.wallet_address) {
        console.log('Setting wallet address:', data.data.wallet_address);
        setWalletAddress(data.data.wallet_address);
      } else {
        console.log('Failed condition check:', { status: data.status, hasWalletAddress: !!data.data?.wallet_address });
        error('Failed to get wallet address');
        setHasError(true);
      }
    } catch (err) {
      console.error('Error fetching wallet address:', err);
      error('Failed to fetch wallet address');
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      success('Address copied to clipboard');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        success('Address copied to clipboard');
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
        error('Failed to copy address');
      }
      document.body.removeChild(textArea);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative ml-auto h-full w-full max-w-md bg-[rgb(17,18,20)] shadow-xl transform transition-transform duration-300 ease-in-out"
        style={{ 
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'deposit'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Deposit
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full p-4 space-y-4">
          {/* Info Card */}
          <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
            Deposit SOL, USDC to your GMGN wallet
          </div>

          {/* Wallet Selection */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="w-full">
              <div className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                      <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" className="text-black">
                        <path d="M6.9853 1.0247c.6244-.3015 1.4049-.3015 2.0293 0l6.0283 2.9122c1.276.6168 1.2752 2.1058-.001 2.7226l-.038.0176v5.5264c.1446.1267.2557.2935.3086.4892l.3369 1.2481c.1714.6354-.3077 1.2606-.9659 1.2607h-.7763c-.6531-.0002-1.1312-.6164-.9688-1.249l.3213-1.2481a.997.997 0 0 1 .3438-.5302V7.3538l-.9854.4766v5.4805l-.0058.0771c-.1246.7923-2.1422 1.4228-4.6123 1.4229-2.5449 0-4.609-.6693-4.6182-1.4951V7.8304L.957 6.6595C-.2792 6.0617-.318 4.645.8418 3.9965l.1162-.0596zM9.623 9.3402a3.63 3.63 0 0 1-.5937.2236l-.0147.0078c-.5854.2828-1.3076.301-1.9101.0537l-.1192-.0537-.0107-.0058a3.6 3.6 0 0 1-.5987-.2246l-1.5937-.7706v4.3184c.0932.0445.2205.0979.3887.1523.6617.2144 1.6622.3692 2.829.3692 1.131 0 2.1078-.1461 2.7715-.3516.1943-.0602.3408-.1205.4463-.1709V8.5706zM8.4052 2.2855c-.2396-.1156-.5709-.1155-.8105 0l-6.0283 2.912c-.0802.0388-.1237.0772-.1465.1007.0227.0234.066.0616.1465.1006L7.456 8.2435c.3551.082.7318.082 1.087 0l5.8905-2.8447c.0799-.0387.1227-.0772.1456-.1006-.023-.0235-.0658-.062-.1456-.1006z"/>
                      </svg>
                    </div>
                    <span className="text-white text-sm font-medium">{selectedWallet}</span>
                  </div>
                  {isLoading ? (
                    <span className="text-gray-400 text-sm">Loading...</span>
                  ) : hasError ? (
                    <span className="text-red-400 text-sm">Error</span>
                  ) : walletAddress ? (
                    <>
                      <span className="text-gray-400 text-sm">
                        {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                      </span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(walletAddress);
                        }}
                        className={`transition-colors cursor-pointer ${
                          copySuccess ? 'text-green-400' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {copySuccess ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">No address</span>
                  )}
                </div>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
                  <path d="M14.203 5.591a.7005.7005 0 0 0 0-.9903.7006.7006 0 0 0-.9903 0L7.9999 9.8136l-5.213-5.213a.7006.7006 0 0 0-.9902 0 .7007.7007 0 0 0 0 .9903l5.708 5.708a.7004.7004 0 0 0 .9903 0z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <div className="text-white font-medium">{selectedWallet}</div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  {isLoading ? (
                    <span>Loading...</span>
                  ) : hasError ? (
                    <span className="text-red-400">Error loading address</span>
                  ) : walletAddress ? (
                    <>
                      {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                      <div
                        onClick={() => copyToClipboard(walletAddress)}
                        className={`transition-colors cursor-pointer ${
                          copySuccess ? 'text-green-400' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {copySuccess ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </div>
                    </>
                  ) : (
                    <span>No address available</span>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center mt-6">
              {isLoading ? (
                <div className="bg-gray-200 p-4 rounded-lg mb-4 flex items-center justify-center w-40 h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : hasError ? (
                <div className="bg-red-100 p-4 rounded-lg mb-4 flex items-center justify-center w-40 h-40">
                  <span className="text-red-600 text-sm text-center">Failed to load QR code</span>
                </div>
              ) : walletAddress ? (
                <div className="bg-white p-4 rounded-lg mb-4">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${walletAddress}`}
                    alt="Wallet Address QR Code"
                    width={160}
                    height={160}
                    className="block"
                  />
                </div>
              ) : (
                <div className="bg-gray-200 p-4 rounded-lg mb-4 flex items-center justify-center w-40 h-40">
                  <span className="text-gray-600 text-sm text-center">No address available</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-sm font-mono mb-2 select-none">
                {walletAddress ? (
                  <>
                    <span>{walletAddress}</span>
                    <div
                      onClick={() => copyToClipboard(walletAddress)}
                      className={`transition-colors cursor-pointer ${
                        copySuccess ? 'text-green-400' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {copySuccess ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">No address available</span>
                )}
              </div>

              {/* Warning */}
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2 text-yellow-400">
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 flex-shrink-0">
                    <path fillRule="evenodd" d="M9.9999 19.9998c5.5228 0 9.9999-4.4771 9.9999-10 0-5.5227-4.4771-9.9998-10-9.9998C4.4772 0 0 4.4771 0 9.9999s4.4771 9.9999 9.9999 9.9999m0-8.3335c-.6904 0-1.25-.5596-1.25-1.2499V5.1391c0-.6903.5596-1.25 1.25-1.25s1.2499.5597 1.2499 1.25v5.2773c0 .6903-.5596 1.2499-1.25 1.2499m1.2499 2.0836c0 .6903-.5596 1.2499-1.25 1.2499S8.75 14.4402 8.75 13.7499 9.3095 12.5 9.9999 12.5s1.2499.5596 1.2499 1.2499" clipRule="evenodd"/>
                  </svg>
                  <div className="text-sm leading-4">
                    Caution: This address only supports SOL, USDC deposits via the Solana network. Please do not use other networks to avoid any loss of funds.
                  </div>
                </div>
              </div>

              {/* Copy Address Button */}
              <button
                onClick={() => walletAddress && copyToClipboard(walletAddress)}
                disabled={!walletAddress || isLoading}
                className={`w-full mt-4 font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                  copySuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {isLoading 
                  ? 'Loading...' 
                  : copySuccess 
                    ? 'Copied!' 
                    : walletAddress 
                      ? 'Copy Address' 
                      : 'Address Unavailable'
                }
              </button>

              {/* Refresh Balance Button */}
              <button
                onClick={() => {
                  console.log('[DepositModal] Manual balance refresh');
                  refetchBalance();
                  success('Balance refreshed');
                }}
                className="w-full mt-2 font-semibold py-3 px-4 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              >
                Refresh Balance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}