"use client";

import { useState } from 'react';
import DepositModal from './deposit-modal';
import WithdrawModal from './withdraw-modal';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useUserTransactionHistory } from '@/hooks/useUserTransactionHistory';
import { calculateTotalProfit } from '@/lib/formatters';

export default function WalletActions() {
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    
    const { balances, totalUsdValue, isLoading, error } = useWalletBalance();
    const { data: historyData } = useUserTransactionHistory({ limit: 1000 }); // Get all transactions

    // Get SOL balance for main display
    const solBalance = balances.find(b => b.chain_id === 501);
    
    // Calculate total RPnl and UPnl from all transactions
    const { totalRPnlUSD, totalUPnlUSD, totalPnlUSD, totalPnlPercent } = (() => {
        if (!historyData || !historyData.transactions || historyData.transactions.length === 0) {
            return { totalRPnlUSD: 0, totalUPnlUSD: 0, totalPnlUSD: 0, totalPnlPercent: 0 };
        }

        let sumRPnl = 0;
        let sumUPnl = 0;
        let sumRPnlPercent = 0;
        let sumUPnlPercent = 0;
        let count = 0;

        historyData.transactions.forEach(tx => {
            const profit = calculateTotalProfit(
                tx.bought_amount_native,
                tx.bought_amount_token,
                tx.sold_amount_native,
                tx.sold_amount_token,
                tx.quote,
                tx.chain_id
            );

            // Sum up RPnl and UPnl in USD (already converted by calculateTotalProfit)
            sumRPnl += profit.RPnlUSD;
            sumUPnl += profit.UPnlUSD;
            sumRPnlPercent += profit.RPnlPercent;
            sumUPnlPercent += profit.UPnlPercent;
            count++;
        });

        // Already in USD from calculateTotalProfit
        const totalRPnlUSD = sumRPnl;
        const totalUPnlUSD = sumUPnl;
        const totalPnlUSD = totalRPnlUSD + totalUPnlUSD;
        const totalPnlPercent = count > 0 ? (sumRPnlPercent + sumUPnlPercent) / count : 0;

        return { totalRPnlUSD, totalUPnlUSD, totalPnlUSD, totalPnlPercent };
    })();
    
    return (
        <div className="flex flex-col min-w-[430px] gap-3 basis-1/2 flex-1 overflow-hidden">
            {/* Header */}
            <div className="h-[52px] min-h-[52px] px-4 border-solid border-b border-custom-border flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-white text-[16px] leading-[20px]">Wallets</div>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pb-6 flex flex-col">
                {/* Total Balance */}
                <span className="text-second-font-color text-[14px]">Total Balance</span>
                <div className="flex items-center gap-8">
                    <div className="flex gap-2 h-9 mt-1 items-baseline">
                        <svg width="24" height="24" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                            <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                            <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                        </svg>
                        <div className="text-white text-[32px] leading-9 font-semibold">
                            {isLoading ? '...' : solBalance ? solBalance.formattedBalance.toFixed(4) : '0'}
                        </div>
                        <div className="text-white text-[16px] font-medium translate-y-[-1px]">
                            ${isLoading ? '...' : totalUsdValue.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Individual Chain Balances */}
                {!isLoading && balances.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {balances.map((balance) => (
                            <div key={balance.chain_id} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                    {/* Chain Icon */}
                                    {balance.chain_id === 501 && (
                                        <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                                            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                                            <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                                            <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                                        </svg>
                                    )}
                                    {balance.chain_id === 1 && (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-blue-400">
                                            <path d="M8.0001 16c4.4183 0 8-3.5817 8-8s-3.5817-8-8-8-8 3.5817-8 8 3.5817 8 8 8"/>
                                            <path d="M8.0001 12.8571V8.5714L4.5715 6.8571 8.0001 3.1429l3.4286 3.7142L8.0001 8.5714v4.2857z" fill="white"/>
                                        </svg>
                                    )}
                                    {balance.chain_id === 0 && (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
                                            <path d="M8 16c4.4183 0 8-3.5817 8-8s-3.5817-8-8-8-8 3.5817-8 8 3.5817 8 8 8"/>
                                            <path d="M5.09 6.25l1.46-.89 1.45.89v1.5l-1.45.89-1.46-.89zm3.82 0l1.46-.89 1.45.89v1.5l-1.45.89-1.46-.89zm-1.91 2.5l1.46-.89 1.45.89v1.5l-1.45.89-1.46-.89z" fill="white"/>
                                        </svg>
                                    )}
                                    <span className="text-white text-sm font-medium">{balance.symbol}</span>
                                    <span className="text-gray-400 text-xs">({balance.chain_name})</span>
                                </div>
                                <div className="text-white text-sm font-medium">
                                    {balance.formattedBalance.toFixed(balance.symbol === 'SOL' ? 4 : 6)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-4 text-red-400 text-sm">
                        Error: {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="flex gap-y-2 mt-3 flex-wrap justify-between flex-row">
                    {/* Total PnL */}
                    <div className="flex items-center h-[18px] min-w-[calc(50%-16px)]">
                        <span className="text-second-font-color text-[14px] whitespace-nowrap">Total PnL</span>
                        <div className="flex ml-1 cursor-pointer text-[13px] lg:text-[14px] items-center hover:bg-gray-800 px-1 rounded gap-1 text-gray-500">
                            USD
                            <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 16 16" fill="currentColor" className="text-second-font-color">
                                <path d="M.146 8.0005c0-1.023.1987-2 .5547-2.8965l-.0772-.045C.121 4.761.0977 4.042.5795 3.7115l3.0166-2.0688c.1497-.1026.3477.031.3084.2082l-.7702 3.4768c-.1178.5316-.7211.7923-1.1895.5147l-.0234-.0137a6.45 6.45 0 0 0-.375 2.1719c.0003 3.5641 2.89 6.4531 6.454 6.4531a6.45 6.45 0 0 0 2.0284-.3252c.367-.1214.7633.0783.8848.4453a.7.7 0 0 1-.4444.8838 7.85 7.85 0 0 1-2.4687.3965C3.663 15.854.1463 12.3378.146 8.0005m14.3076 0c0-3.5643-2.8889-6.454-6.4531-6.4541a6.46 6.46 0 0 0-1.9102.2871.7.7 0 0 1-.875-.462.7004.7004 0 0 1 .462-.8759A7.85 7.85 0 0 1 8.0005.146c4.3374.0001 7.8535 3.517 7.8535 7.8545a7.83 7.83 0 0 1-.5801 2.958l.1055.0635c.503.3029.5192 1.0264.0303 1.3515l-3.0864 2.0527c-.1482.0986-.3416-.031-.3069-.2056l.7067-3.5482.0264-.0987c.1584-.4764.726-.6983 1.1709-.4306l.1377.083a6.44 6.44 0 0 0 .3955-2.2256"></path>
                                <path d="M7.2993 11.7068v-.461H5.4077a.7.7 0 0 1-.7002-.6992.7003.7003 0 0 1 .7002-.7002H9.65a.5687.5687 0 0 0 .5684-.5683.569.569 0 0 0-.5684-.5684H6.3765c-1.1015 0-1.9951-.8926-1.9951-1.9941s.8936-1.9942 1.995-1.9942h.923v-.4287c0-.3865.3136-.7.7001-.7002a.7003.7003 0 0 1 .7002.7002v.4287h1.8096a.7.7 0 0 1 .6992.7002.6994.6994 0 0 1-.6992.6993H6.3765a.595.595 0 0 0-.5948.5947.595.595 0 0 0 .5948.5947h3.2734c1.0869 0 1.9677.881 1.9678 1.9678s-.8809 1.9677-1.9678 1.9677h-.9502v.461a.7005.7005 0 0 1-.7002.7002.7007.7007 0 0 1-.7002-.7002"></path>
                            </svg>
                        </div>
                        <span className={`ml-1 text-[14px] font-medium whitespace-nowrap ${totalPnlUSD >= 0 ? 'text-[rgb(134,217,159)]' : 'text-[rgb(242,102,130)]'}`}>
                            ${totalPnlUSD.toFixed(2)} ({totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
                        </span>
                    </div>

                    {/* Unrealized Profits */}
                    <div className="flex items-center h-[18px] gap-2 min-w-[calc(50%-16px)]">
                        <span className="text-second-font-color text-[14px] whitespace-nowrap">Unrealized Profits</span>
                        <span className={`text-[14px] font-medium ${totalUPnlUSD >= 0 ? 'text-[rgb(134,217,159)]' : 'text-[rgb(242,102,130)]'}`}>
                            ${totalUPnlUSD.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons Grid */}
                <div className="flex-1 mt-50 grid justify-items-center items-center gap-y-[18px] grid-cols-4 mt-5 pt-3 border-t border-solid border-custom-border">
                    {/* Deposit */}
                    <div 
                        className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setIsDepositModalOpen(true)}
                    >
                        <div className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-[rgb(27,34,30)] hover:bg-[rgb(34,46,39)] text-[rgb(134,217,159)] w-12 h-12 2xl:w-14 2xl:h-14 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="currentColor" className="text-[rgb(134,217,159)] w-5 h-5 2xl:w-6 2xl:h-6">
                                <path fillRule="evenodd" d="M1.8462 9c0 3.951 3.2028 7.1538 7.1538 7.1538S16.1538 12.951 16.1538 9a7.2 7.2 0 0 0-.1646-1.5339.9231.9231 0 0 1 1.8037-.3938A9.03 9.03 0 0 1 18 9c0 4.9706-4.0294 9-9 9s-9-4.0294-9-9 4.0294-9 9-9a9.03 9.03 0 0 1 1.9277.2071.9231.9231 0 0 1-.3938 1.8037A7.2 7.2 0 0 0 9 1.846c-3.951 0-7.1538 3.203-7.1538 7.1539" clipRule="evenodd"></path>
                                <path fillRule="evenodd" d="M10.6247 7.2991a.923.923 0 0 1-.2724-.6548v-2.889a.9231.9231 0 0 1 1.8461 0v.6491l3.1065-3.1288c.3592-.3618.9437-.3639 1.3054-.0047a.923.923 0 0 1 .0047 1.3054L13.4979 5.716c.2766.0008.5304.0024.7253.0054a.923.923 0 0 1 .9087.9372.923.923 0 0 1-.9371.9088c-.4211-.0065-1.1463-.0066-1.7732-.0049-.312.0008-.5972.002-.8044.0031l-.3358.0019a.923.923 0 0 1-.6567-.2683" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <span className="text-[12px] 2xl:text-sm font-medium">Deposit</span>
                    </div>

                    {/* Buy */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-[rgb(27,34,30)] hover:bg-[rgb(34,46,39)] text-[rgb(134,217,159)] w-12 h-12 2xl:w-14 2xl:h-14 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="currentColor" className="text-[rgb(134,217,159)] w-5 h-5 2xl:w-6 2xl:h-6">
                                <g fillRule="evenodd" clipPath="url(#clip0_13109_85)" clipRule="evenodd">
                                    <path d="M9 2.1867c-3.7634 0-6.8143 3.0509-6.8143 6.8143 0 3.4591 2.5773 6.3161 5.9164 6.7557.4928.0648.8979.4615.8979.9586s-.4042.9049-.8986.8537C3.7662 17.1196.3857 13.4551.3857 9.001.3857 4.2435 4.2425.3867 9 .3867c2.2274 0 4.2581.8463 5.7866 2.233.3682.334.3338.907-.0366 1.2385s-.936.2946-1.313-.0293C12.2442 2.8045 10.6947 2.1867 9 2.1867"></path>
                                    <path d="m13.4168 9.5662.819-.757a.903.903 0 0 0 .0582-1.2675.903.903 0 0 0-1.2796-.0634l-2.545 2.319a.9.9 0 0 0 .602 1.5689H17.1a.9.9 0 0 0 0-1.8z"></path>
                                    <path d="m14.7546 14.9153-.819.757a.9033.9033 0 0 0 1.2214 1.3309l2.545-2.319a.9.9 0 0 0-.602-1.5689h-6.0286a.9.9 0 0 0 0 1.8z"></path>
                                </g>
                                <defs><clipPath id="clip0_13109_85"><rect width="18" height="18"></rect></clipPath></defs>
                            </svg>
                        </div>
                        <span className="text-[12px] 2xl:text-sm font-medium">Buy</span>
                    </div>

                    {/* Withdraw */}
                    <div 
                        className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setIsWithdrawModalOpen(true)}
                    >
                        <div className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-[rgb(27,34,30)] hover:bg-[rgb(34,46,39)] text-[rgb(134,217,159)] w-12 h-12 2xl:w-14 2xl:h-14 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="currentColor" className="text-[rgb(134,217,159)] w-5 h-5 2xl:w-6 2xl:h-6">
                                <path fillRule="evenodd" d="M1.8462 9c0 3.951 3.2028 7.1538 7.1538 7.1538S16.1538 12.951 16.1538 9a7.2 7.2 0 0 0-.1646-1.5339.9231.9231 0 0 1 1.8037-.3938A9.03 9.03 0 0 1 18 9c0 4.9706-4.0294 9-9 9s-9-4.0294-9-9 4.0294-9 9-9a9.03 9.03 0 0 1 1.9277.2071.9231.9231 0 0 1-.3938 1.8037A7.2 7.2 0 0 0 9 1.846c-3.951 0-7.1538 3.203-7.1538 7.1539" clipRule="evenodd"></path>
                                <path fillRule="evenodd" d="M17.7275.2683a.923.923 0 0 1 .2724.6548v2.889a.923.923 0 0 1-1.8461 0v-.6492l-3.1065 3.129a.923.923 0 0 1-1.3054.0046.923.923 0 0 1-.0047-1.3054l3.1171-3.1396a61 61 0 0 1-.7252-.0054.923.923 0 0 1-.9088-.9372A.923.923 0 0 1 14.1575 0c.421.0065 1.1462.0065 1.7732.0049.3119-.0008.5971-.002.8043-.0031L17.0709 0a.923.923 0 0 1 .6566.2683" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <span className="text-[12px] 2xl:text-sm font-medium">Withdraw</span>
                    </div>

                    {/* Consolidate */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-[rgb(27,34,30)] hover:bg-[rgb(34,46,39)] text-[rgb(134,217,159)] w-12 h-12 2xl:w-14 2xl:h-14 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="currentColor" className="text-[rgb(134,217,159)] w-5 h-5 2xl:w-6 2xl:h-6">
                                <g fillRule="evenodd" clipPath="url(#clip0_11721_844)" clipRule="evenodd">
                                    <path d="M9 12.8c-.9389 0-1.7.7611-1.7 1.7s.7611 1.7 1.7 1.7 1.7-.7611 1.7-1.7-.7611-1.7-1.7-1.7M9 11c-1.933 0-3.5 1.567-3.5 3.5S7.067 18 9 18s3.5-1.567 3.5-3.5S10.933 11 9 11"></path>
                                    <path d="M14.5 1.8c-.9389 0-1.7.7611-1.7 1.7s.7611 1.7 1.7 1.7 1.7-.7611 1.7-1.7-.7611-1.7-1.7-1.7m0-1.8C12.567 0 11 1.567 11 3.5S12.567 7 14.5 7 18 5.433 18 3.5 16.433 0 14.5 0"></path>
                                    <path d="M3.5 1.8c-.9389 0-1.7.7611-1.7 1.7s.7611 1.7 1.7 1.7 1.7-.7611 1.7-1.7-.7611-1.7-1.7-1.7m0-1.8C1.567 0 0 1.567 0 3.5S1.567 7 3.5 7 7 5.433 7 3.5 5.433 0 3.5 0"></path>
                                    <path d="M9.9028 9.9562h3.3986c1.1598 0 2.1-.9402 2.1-2.1V5.9507h-1.8v1.9055a.3.3 0 0 1-.3.3H4.7043a.3.3 0 0 1-.3-.3V5.9507h-1.8v1.9055c0 1.1598.9402 2.1 2.1 2.1h3.3985v1.9618h1.8z"></path>
                                </g>
                                <defs><clipPath id="clip0_11721_844"><rect width="18" height="18" transform="matrix(-1 0 0 -1 18 18)"></rect></clipPath></defs>
                            </svg>
                        </div>
                        <span className="text-[12px] 2xl:text-sm font-medium">Consolidate</span>
                    </div>

                    {/* Distribute */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-[rgb(27,34,30)] hover:bg-[rgb(34,46,39)] text-[rgb(134,217,159)] w-12 h-12 2xl:w-14 2xl:h-14 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="currentColor" className="text-[rgb(134,217,159)] w-5 h-5 2xl:w-6 2xl:h-6">
                                <g fillRule="evenodd" clipPath="url(#clip0_11721_843)" clipRule="evenodd">
                                    <path d="M9 5.2c.9389 0 1.7-.7611 1.7-1.7S9.9389 1.8 9 1.8s-1.7.7611-1.7 1.7.7611 1.7 1.7 1.7M9 7c1.933 0 3.5-1.567 3.5-3.5S10.933 0 9 0 5.5 1.567 5.5 3.5 7.067 7 9 7"></path>
                                    <path d="M3.5 16.2c.9389 0 1.7-.7611 1.7-1.7s-.7611-1.7-1.7-1.7-1.7.7611-1.7 1.7.7611 1.7 1.7 1.7m0 1.8C5.433 18 7 16.433 7 14.5S5.433 11 3.5 11 0 12.567 0 14.5 1.567 18 3.5 18"></path>
                                    <path d="M14.5 16.2c.9389 0 1.7-.7611 1.7-1.7s-.7611-1.7-1.7-1.7-1.7.7611-1.7 1.7.7611 1.7 1.7 1.7m0 1.8c1.933 0 3.5-1.567 3.5-3.5S16.433 11 14.5 11 11 12.567 11 14.5s1.567 3.5 3.5 3.5"></path>
                                    <path d="M8.0972 8.0438H4.6986c-1.1598 0-2.1.9402-2.1 2.1v1.9055h1.8v-1.9055a.3.3 0 0 1 .3-.3h8.5971a.3.3 0 0 1 .3.3v1.9055h1.8v-1.9055c0-1.1598-.9402-2.1-2.1-2.1H9.8972V6.082h-1.8z"></path>
                                </g>
                                <defs><clipPath id="clip0_11721_843"><rect width="18" height="18"></rect></clipPath></defs>
                            </svg>
                        </div>
                        <span className="text-[12px] 2xl:text-sm font-medium">Distribute</span>
                    </div>

                    {/* Transfer */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-[rgb(27,34,30)] hover:bg-[rgb(34,46,39)] text-[rgb(134,217,159)] w-12 h-12 2xl:w-14 2xl:h-14 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="currentColor" className="text-[rgb(134,217,159)] w-5 h-5 2xl:w-6 2xl:h-6">
                                <path d="M11.6777 2.373c.3463-.3847.9394-.4163 1.3243-.0703l3.75 3.375A.938.938 0 0 1 17 6.711a.937.937 0 0 1-.875.6016H1.875a.9375.9375 0 1 1 0-1.875h11.8066L11.748 3.6973c-.3847-.3463-.4163-.9394-.0703-1.3243"></path>
                                <path d="M6.3223 15.627c-.3463.3847-.9394.4163-1.3243.0703l-3.75-3.375A.938.938 0 0 1 1 11.2891a.937.937 0 0 1 .875-.6016h14.25a.9375.9375 0 0 1 .9375.9375.9375.9375 0 0 1-.9375.9375H4.3184l1.9336 1.7402c.3847.3463.4163.9394.0703 1.3243"></path>
                            </svg>
                        </div>
                        <span className="text-[12px] 2xl:text-sm font-medium">Transfer</span>
                    </div>

                    {/* Convert */}
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-[rgb(27,34,30)] hover:bg-[rgb(34,46,39)] text-[rgb(134,217,159)] w-12 h-12 2xl:w-14 2xl:h-14 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 19 18" fill="currentColor" className="text-[rgb(134,217,159)] w-5 h-5 2xl:w-6 2xl:h-6">
                                <path d="M.602 9.8273c.404-.2019.896-.0385 1.0982.3653l2.1116 4.2233h1.3937l1.316-1.9735c.2508-.3757.7588-.4766 1.1347-.2261.3756.2508.4776.7588.2271 1.1346l-1.3275 1.9907a1.598 1.598 0 0 1-1.3286.7111H3.7878a1.598 1.598 0 0 1-1.429-.8835l-2.122-4.2438c-.202-.404-.0385-.8958.3653-1.098M5.9133 1.947c.555 0 1.0647.2876 1.3537.7488l.1096.2089 5.036 11.5101h2.0763l2.1116-4.2232a.818.818 0 0 1 1.4633.7316l-2.1219 4.245a1.598 1.598 0 0 1-1.4291.8823h-2.1253a1.597 1.597 0 0 1-1.4633-.9565L5.8881 3.5837H3.8118L1.7002 7.807c-.2023.4038-.6941.5672-1.0981.3653C.1983 7.97.0348 7.4783.2368 7.0742l2.122-4.2438.1141-.194a1.599 1.599 0 0 1 1.315-.6895zm8.5995 0c.605 0 1.1586.3423 1.4291.8835l2.1219 4.2438c.202.404.0385.8958-.3652 1.098-.404.202-.8958.0386-1.0981-.3652l-2.1116-4.2233h-1.3937L11.779 5.5572c-.2507.3757-.7587.4765-1.1346.226-.3757-.2507-.4777-.7587-.2271-1.1345l1.3275-1.9907a1.598 1.598 0 0 1 1.3286-.7111z"></path>
                            </svg>
                        </div>
                        <span className="text-[12px] 2xl:text-sm font-medium">Convert</span>
                    </div>
                </div>
            </div>

            {/* Deposit Modal */}
            <DepositModal 
                isOpen={isDepositModalOpen} 
                onClose={() => setIsDepositModalOpen(false)} 
            />

            {/* Withdraw Modal */}
            <WithdrawModal 
                isOpen={isWithdrawModalOpen} 
                onClose={() => setIsWithdrawModalOpen(false)} 
            />
        </div>
    );
}