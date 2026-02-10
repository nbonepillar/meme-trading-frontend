"use client";

import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';
import { useWalletBalance } from '@/hooks/useWalletBalance';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const [activeTab, setActiveTab] = useState('withdraw');
  const [chainId, setChainId] = useState('501'); // Default to Solana
  const [toWallet, setToWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { getToken } = useAuthStore();
  const { toasts, removeToast, success, error } = useToast();
  const { balances, refetch: refetchBalance } = useWalletBalance();

  // Get balance for selected chain
  const selectedBalance = balances.find(b => b.chain_id === parseInt(chainId));

  const handleWithdraw = async () => {
    if (!toWallet || !amount) {
      error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const token = getToken();
      if (!token) {
        error('Authentication required');
        return;
      }

      const withdrawData = {
        chain_id: parseInt(chainId),
        to_wallet: toWallet,
        amount: Math.floor(parseFloat(amount) * 1000000000) // Convert to lamports
      };

      console.log('Withdraw data:', withdrawData);
      
      // Direct call to backend (CORS now handled by backend)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
      const response = await fetch(`${API_BASE_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(withdrawData)
      });

      const data = await response.json();
      console.log('Withdraw response:', data);
      console.log('Response status:', response.status, 'Response ok:', response.ok, 'Data status:', data.status);
      
      // Schedule balance refresh in 5 seconds regardless of success/failure
      console.log('Withdraw request sent, will refresh balance in 5 seconds...');
      setTimeout(() => {
        console.log('Refreshing balance after withdraw request...');
        refetchBalance();
        // Also trigger refresh for holdings and history
        window.dispatchEvent(new CustomEvent('refreshBalance'));
      }, 5000);
      
      // Check for success in multiple ways
      const isSuccess = response.ok && data.status === 0;
      const hasSuccessMessage = data.message && (
        data.message.toLowerCase().includes('success') || 
        data.message.toLowerCase().includes('sent') ||
        data.message.toLowerCase().includes('monitored') ||
        data.message.toLowerCase().includes('submitted')
      );
      
      if (isSuccess || hasSuccessMessage) {
        // Success case - show green message
        if (data.data?.success && data.data?.tx_hash) {
          success(`Withdrawal successful! TX: ${data.data.tx_hash.slice(0, 8)}...`);
        } else if (data.message) {
          success(data.message);
        } else {
          success('Withdrawal request submitted successfully');
        }
        
        // Clear form and close modal
        setTimeout(() => {
          setToWallet('');
          setAmount('');
          onClose();
        }, 2500);
      } else {
        // Error case - show red message
        error(data.message || `Withdrawal failed (${response.status})`);
      }
    } catch (err) {
      console.error('Withdraw error:', err);
      error('Network error: Failed to process withdrawal');
      
      // Schedule balance refresh in 5 seconds even on error
      console.log('Withdraw request failed, will still refresh balance in 5 seconds...');
      setTimeout(() => {
        console.log('Refreshing balance after withdraw error...');
        refetchBalance();
        // Also trigger refresh for holdings and history
        window.dispatchEvent(new CustomEvent('refreshBalance'));
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Clear messages when form values change
  const handleToWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToWallet(e.target.value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
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
              onClick={() => setActiveTab('withdraw')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'withdraw'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Withdraw
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
            Withdraw SOL, USDC from your GMGN wallet
          </div>

          {/* Withdraw Form */}
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h3 className="text-white font-medium">Withdraw Details</h3>
            
            {/* Chain */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chain
              </label>
              <select
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                disabled={loading}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="501">Solana</option>
                <option value="1">Ethereum</option>
                <option value="56">BSC</option>
              </select>
            </div>

            {/* To Wallet Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To Wallet Address
              </label>
              <input
                type="text"
                value={toWallet}
                onChange={handleToWalletChange}
                placeholder="Enter destination wallet address"
                disabled={loading}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (SOL)
              </label>
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount in SOL"
                step="0.000000001"
                min="0"
                disabled={loading}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="flex items-center justify-between mt-1">
                {selectedBalance && (
                  <div className="text-xs text-gray-400">
                    Balance: <span className="text-white font-medium">{selectedBalance.formattedBalance.toFixed(4)} {selectedBalance.symbol}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2 text-red-400">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 flex-shrink-0">
                  <path fillRule="evenodd" d="M9.9999 19.9998c5.5228 0 9.9999-4.4771 9.9999-10 0-5.5227-4.4771-9.9998-10-9.9998C4.4772 0 0 4.4771 0 9.9999s4.4771 9.9999 9.9999 9.9999m0-8.3335c-.6904 0-1.25-.5596-1.25-1.2499V5.1391c0-.6903.5596-1.25 1.25-1.25s1.2499.5597 1.2499 1.25v5.2773c0 .6903-.5596 1.2499-1.25 1.2499m1.2499 2.0836c0 .6903-.5596 1.2499-1.25 1.2499S8.75 14.4402 8.75 13.7499 9.3095 12.5 9.9999 12.5s1.2499.5596 1.2499 1.2499" clipRule="evenodd"/>
                </svg>
                <div className="text-sm leading-4">
                  Warning: Double-check the destination address. Transactions cannot be reversed once confirmed.
                </div>
              </div>
            </div>

            {/* Withdraw Button */}
            <button
              onClick={handleWithdraw}
              disabled={loading || !toWallet || !amount}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}