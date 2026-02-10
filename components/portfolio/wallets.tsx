"use client";

import { Edit, Trash2, Copy, ChevronRight, ExternalLink, MoreHorizontal, BarChart3, Share } from 'lucide-react';
import { useState } from 'react';

type Row = {
    id: number;
    wallet_info: string;
    vol: string;
    tokens: string;
    chain_id: string;
    wallet_name?: string;
    avatar?: string;
};

type Props = {
    rows: Row[];
};

export default function WalletTable({ rows }: Props) {
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows(new Set());
            setSelectAll(false);
        } else {
            setSelectedRows(new Set(rows.map(row => row.id)));
            setSelectAll(true);
        }
    };

    const handleRowSelect = (rowId: number) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(rowId)) {
            newSelectedRows.delete(rowId);
        } else {
            newSelectedRows.add(rowId);
        }
        setSelectedRows(newSelectedRows);
        setSelectAll(newSelectedRows.size === rows.length);
    };

    return (
        <div className="flex flex-1 h-full flex-col py-2 pt-0 border-solid border-gray-700">
            {/* Header */}
            <div className="h-[52px] flex items-center justify-between flex-wrap px-4 border-solid border-gray-700">
                <div className="flex items-center flex-wrap gap-3 text-white mr-3">
                    <span className="text-[16px] text-white font-semibold leading-[20px]">SOL Wallet ({rows.length})</span>
                    <div className="flex items-center gap-1 cursor-pointer text-[12px] text-gray-400 hover:text-[#86D99F] transition-colors">
                        Log
                        <ChevronRight className="w-2.5 h-2.5" />
                    </div>
                    {/* Chain Switch Icons */}
                    <div className="flex cursor-pointer">
                        <div className="flex items-center gap-1 justify-center w-6 h-6 cursor-pointer">
                            <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                                <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                                <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                                <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                            </svg>
                        </div>
                        <div className="flex items-center gap-1 justify-center w-6 h-6 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="" viewBox="0 0 20 20" className="opacity-40">
                                <path fill="#f0b90e" fillRule="evenodd" d="M10 0c5.5232 0 10 4.4768 10 10s-4.4768 10-10 10S0 15.5232 0 10 4.4768 0 10 0" clipRule="evenodd"></path>
                                <path fill="#fff" d="m5.496 10.0001.0072 2.6442L7.75 13.9665v1.548l-3.5617-2.0889V9.2269zm0-2.6442v1.5408l-1.3085-.774V6.5818l1.3085-.774 1.3149.774zm3.1923-.774 1.3085-.7741 1.3149.774-1.315.774z"></path>
                                <path fill="#fff" d="M6.4415 12.0963v-1.5481l1.3085.774v1.5409zm2.2468 2.4246 1.3085.7741 1.3149-.7741v1.5409l-1.315.774-1.3084-.774zm4.5-7.939 1.3085-.7741 1.3149.774v1.5409l-1.3149.774V7.356zm1.3085 6.0624.0072-2.6442 1.3085-.774v4.1987l-3.5617 2.0889v-1.548z"></path>
                                <path fill="#fff" d="m13.5586 12.0962-1.3085.7668v-1.5409l1.3085-.774z"></path>
                                <path fill="#fff" d="m13.5585 7.904.0072 1.548-2.2532 1.3221v2.6507l-1.3085.7668-1.3085-.7668v-2.6507l-2.2532-1.322V7.904l1.3141-.774L9.996 8.4583 12.2492 7.13l1.3149.774zm-7.117-2.6435 3.5553-2.0961 3.5617 2.0961-1.3085.774L9.9968 4.706 7.75 6.0346z"></path>
                            </svg>
                        </div>
                        <div className="flex items-center gap-1 justify-center w-6 h-6 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="" viewBox="0 0 20 20" className="opacity-40">
                                <rect width="20" height="20" fill="#0052ff" rx="10"></rect>
                                <path fill="#fff" d="M9.987 17.6248c4.2182 0 7.6378-3.4137 7.6378-7.6248s-3.4196-7.6248-7.6379-7.6248c-4.004 0-7.2883 3.0756-7.6117 6.9894h10.1577v1.2708H2.3752c.3234 3.9138 3.6078 6.9894 7.6117 6.9894"></path>
                            </svg>
                        </div>
                        <div className="flex items-center gap-1 justify-center w-6 h-6 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="" viewBox="0 0 16 16" className="opacity-40">
                                <circle cx="8" cy="8" r="8" fill="#836ef9"></circle>
                                <path fill="#fff" d="M8 2.5C6.4404 2.5 2.5998 6.4116 2.5998 8s3.8406 5.5 5.4 5.5S13.4 9.5883 13.4 8 9.5593 2.5 7.9998 2.5m-.8416 8.645c-.6576-.1825-2.4256-3.3324-2.2463-4.0021.1792-.6698 3.2718-2.4705 3.9294-2.288s2.4256 3.3324 2.2464 4.0022-3.2719 2.4705-3.9295 2.2879"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-4 flex-1">
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-300 cursor-pointer">
                        <Share className="w-3 h-3" />
                        <div className="text-nowrap text-gray-400">Share</div>
                    </div>
                    <button type="button" className="flex items-center gap-1.5 text-gray-400 hover:text-[#86D99F] transition-colors cursor-pointer text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M.3323 2.8218C.3325 1.6495 1.283.6989 2.4553.6988h7.3711a.7003.7003 0 0 1 .7002.7001.7003.7003 0 0 1-.7002.7002h-7.371a.723.723 0 0 0-.7227.7227c0 .2711.2874.667 1 .667.4564 0 2.5646-.0207 4.5654-.041.9985-.0102 1.9683-.0198 2.6885-.0274.3601-.0038.6585-.0075.8662-.0098.1037-.001.1849-.0023.2402-.0029h.085l.0078-.001h3.7529c.4438.0001.8027.362.7998.8057l-.0732 10.2939c-.0031.4396-.3603.7949-.7998.795H2.0325c-.9389 0-1.7001-.7614-1.7002-1.7002zM1.7327 13.601c0 .1656.1341.2998.2998.2998h12.2363l.0654-9.0938h-3.1631c-.0142.0002-.0358.0007-.0634.001l-.2403.003c-.2077.0022-.506.005-.8662.0087-.7204.0077-1.6906.0182-2.6894.0283-1.995.0204-4.1134.04-4.5791.04-.3338 0-.6785-.0636-1-.1855z"></path>
                            <path d="M7.327 7.2027c0-.3719.301-.6737.6729-.674.3719 0 .6738.302.6738.674v2.6521l.9228-.9208a.6734.6734 0 0 1 .9512.9532l-2.0713 2.0692a.674.674 0 0 1-.9521 0L5.452 9.8872a.6733.6733 0 0 1-.001-.9522.6736.6736 0 0 1 .847-.087l.1052.086.9238.9218z"></path>
                        </svg>
                        <span>Import</span>
                    </button>
                    <button type="button" className="flex items-center gap-1.5 text-[#7BC891] hover:text-[#86D99F] transition-colors cursor-pointer text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8.7012 14.4645a.7003.7003 0 0 1-.7002.7002.7003.7003 0 0 1-.7002-.7002V1.5348A.7003.7003 0 0 1 8.001.8346a.7003.7003 0 0 1 .7002.7002z"></path>
                            <path d="M1.5361 7.301a.7003.7003 0 0 0-.7002.7002c0 .3866.3136.7002.7002.7002h12.9297a.7003.7003 0 0 0 .7002-.7002.7003.7003 0 0 0-.7002-.7002z"></path>
                        </svg>
                        <span>Create Wallet</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex flex-1 flex-col overflow-auto">
                <table className="table-auto w-full">
                    <thead className="h-[44px] border-b-[0.5px] border-t-3 border-r-3 border-l-3 border-b-1 border-custom-border">
                        <tr>
                            <th className="text-left w-[25%] px-4">
                                <span className="flex items-center gap-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                            className="w-3.5 h-3.5 text-[#86D99F] bg-gray-800 border-gray-600 rounded focus:ring-[#86D99F] focus:ring-2 cursor-pointer"
                                        />
                                    </label>
                                    <span className="text-[14px] text-white font-normal">Select All</span>
                                </span>
                            </th>
                            <th className="text-left w-[20%] px-4">
                                <div className="flex items-center gap-1">
                                    <div className="flex font-medium text-second-font-color text-xs">
                                        <span>Vol</span>
                                    </div>
                                    <span className="flex flex-col">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 8 8" fill="currentColor" className="text-gray-500">
                                            <path d="M3.7036.8702a.3754.3754 0 0 1 .5935 0l3.308 4.27a.75.75 0 0 1 .1574.4599v.9462a.3754.3754 0 0 1-.3755.3755L.6128 6.9214a.3754.3754 0 0 1-.3754-.3754v-.9462a.75.75 0 0 1 .1574-.46z"></path>
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 8 8" fill="currentColor" className="text-gray-500">
                                            <path d="M3.7036 7.127a.3754.3754 0 0 0 .5935 0l3.308-4.2699a.75.75 0 0 0 .1574-.4598V1.451a.3754.3754 0 0 0-.3755-.3754l-6.7742.0003a.3754.3754 0 0 0-.3754.3754v.9463c0 .1665.0554.3283.1574.46z"></path>
                                        </svg>
                                    </span>
                                </div>
                            </th>
                            <th className="text-second-font-color w-[20%] text-left px-4 text-xs">
                                <span className="text-sm font-medium">Tokens</span>
                            </th>
                            <th className="text-left w-[20%] px-4">
                                <div className="flex items-center gap-1">
                                    <div className="flex font-medium text-second-font-color text-xs">SOL</div>
                                    <span className="flex flex-col">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 8 8" fill="currentColor" className="text-gray-500">
                                            <path d="M3.7036.8702a.3754.3754 0 0 1 .5935 0l3.308 4.27a.75.75 0 0 1 .1574.4599v.9462a.3754.3754 0 0 1-.3755.3755L.6128 6.9214a.3754.3754 0 0 1-.3754-.3754v-.9462a.75.75 0 0 1 .1574-.46z"></path>
                                        </svg>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 8 8" fill="currentColor" className="text-gray-500">
                                            <path d="M3.7036 7.127a.3754.3754 0 0 0 .5935 0l3.308-4.2699a.75.75 0 0 0 .1574-.4598V1.451a.3754.3754 0 0 0-.3755-.3754l-6.7742.0003a.3754.3754 0 0 0-.3754.3754v.9463c0 .1665.0554.3283.1574.46z"></path>
                                        </svg>
                                    </span>
                                </div>
                            </th>
                            <th className="min-w-[80px] w-[15%] px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-6 text-gray-500 text-xs">
                                    No wallets found
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, index) => (
                                <tr key={row.id} className={`h-[44px] cursor-grab hover:bg-gray-800/50 transition-colors ${index % 2 === 1 ? 'bg-gray-800/30' : ''}`}>
                                    <td className="px-4">
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.has(row.id)}
                                                    onChange={() => handleRowSelect(row.id)}
                                                    className="w-3.5 h-3.5 text-[#86D99F] bg-gray-800 border-gray-600 rounded focus:ring-[#86D99F] focus:ring-2 cursor-pointer"
                                                />
                                            </label>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400 cursor-grab">
                                                <path d="M5.3657 12.2147c.5819 0 1.0536.4718 1.0536 1.0537s-.4717 1.0537-1.0536 1.0537-1.0537-.4718-1.0537-1.0537.4718-1.0537 1.0537-1.0537"></path>
                                                <path d="M10.634 12.2147c.5819 0 1.0536.4718 1.0536 1.0537s-.4717 1.0537-1.0536 1.0537-1.0537-.4718-1.0537-1.0537.4718-1.0537 1.0537-1.0537"></path>
                                                <path d="M5.3657 6.9464c.5819 0 1.0536.4718 1.0536 1.0537s-.4717 1.0537-1.0536 1.0537S4.312 8.582 4.312 8s.4718-1.0537 1.0537-1.0537"></path>
                                                <path d="M10.634 6.9464c.5819 0 1.0536.4718 1.0536 1.0537s-.4717 1.0537-1.0536 1.0537S9.5803 8.582 9.5803 8s.4718-1.0537 1.0537-1.0537"></path>
                                                <path d="M5.3657 1.6781c.5819 0 1.0536.4718 1.0536 1.0537s-.4717 1.0537-1.0536 1.0537S4.312 3.3137 4.312 2.7318 4.7838 1.678 5.3657 1.678"></path>
                                                <path d="M10.634 1.6781c.5819 0 1.0536.4718 1.0536 1.0537s-.4717 1.0537-1.0536 1.0537-1.0537-.4718-1.0537-1.0537.4718-1.0537 1.0537-1.0537"></path>
                                            </svg>
                                            <div className="flex items-center gap-2">
                                                {/* Wallet Tags */}
                                                <div className="flex gap-1 items-center">
                                                    <div className="flex h-5 items-center rounded text-[13px] leading-4 font-normal text-white gap-1">
                                                        {row.id === 1 && (
                                                            <span className="flex gap-0.5 items-center text-yellow-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M.3323 2.8218C.3325 1.6495 1.283.6989 2.4553.6988h7.3711a.7003.7003 0 0 1 .7002.7001.7003.7003 0 0 1-.7002.7002h-7.371a.723.723 0 0 0-.7227.7227c0 .2711.2874.667 1 .667.4564 0 2.5646-.0207 4.5654-.041.9985-.0102 1.9683-.0198 2.6885-.0274.3601-.0038.6585-.0075.8662-.0098.1037-.001.1849-.0023.2402-.0029h.085l.0078-.001h3.7529c.4438.0001.8027.362.7998.8057l-.0732 10.2939c-.0031.4396-.3603.7949-.7998.795H2.0325c-.9389 0-1.7001-.7614-1.7002-1.7002zM1.7327 13.601c0 .1656.1341.2998.2998.2998h12.2363l.0654-9.0938h-3.1631c-.0142.0002-.0358.0007-.0634.001l-.2403.003c-.2077.0022-.506.005-.8662.0087-.7204.0077-1.6906.0182-2.6894.0283-1.995.0204-4.1134.04-4.5791.04-.3338 0-.6785-.0636-1-.1855z"></path>
                                                                    <path d="M7.6886 6.5947c.1274-.2581.4955-.2581.6229 0l.6167 1.2497a.347.347 0 0 0 .2615.19l1.3792.2004c.2848.0414.3985.3914.1924.5923l-.998.9728a.347.347 0 0 0-.0998.3074l.2356 1.3736c.0486.2837-.2491.5-.5039.3661l-1.2336-.6486a.348.348 0 0 0-.3232 0l-1.2335.6486c-.2548.1339-.5525-.0824-.5039-.3661l.2356-1.3736a.347.347 0 0 0-.0999-.3074l-.998-.9728c-.206-.2009-.0923-.551.1925-.5923l1.3792-.2004a.347.347 0 0 0 .2615-.19z"></path>
                                                                </svg>
                                                            </span>
                                                        )}
                                                        {row.id === 2 && (
                                                            <span className="flex gap-0.5 items-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                                                    <path d="M13.7354 5.763a.3.3 0 0 0-.2999-.2997H3.0635c-.2821 0-.551-.0556-.7988-.1524v8.0264c0 .1657.134.3008.2997.3008h10.8711a.301.301 0 0 0 .2999-.3008zm-2.6397 2.832a.7003.7003 0 0 1 .7002.7003.7.7 0 0 1-.7002.6992H8.916a.7.7 0 0 1-.7002-.6992.7004.7004 0 0 1 .7002-.7002zm4.0391 4.7423c0 .9387-.7606 1.6999-1.6993 1.7002H2.5645c-.939 0-1.7002-.7613-1.7002-1.7002V3.264C.8643 1.993 1.895.9623 3.166.9623h7.9297a.7003.7003 0 0 1 .7002.7002.7003.7003 0 0 1-.7002.7002H3.166a.9013.9013 0 0 0-.9013.9013c0 .4413.3575.7988.7988.7989h10.372c.9387.0002 1.6992.7615 1.6993 1.7002z"></path>
                                                                </svg>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Avatar */}
                                                <div className="relative" style={{width: '16px', minWidth: '16px', maxWidth: '16px', height: '16px', minHeight: '16px', maxHeight: '16px'}}>
                                                    <img 
                                                        src={row.avatar || `/static/avator/${row.id === 1 ? '301' : '87'}.png`} 
                                                        style={{width: '100%', height: '100%', opacity: 1, borderRadius: '50%', objectFit: 'cover'}} 
                                                        alt="Avatar"
                                                    />
                                                </div>
                                                {/* Wallet Name and Edit */}
                                                <div className="flex">
                                                    <div className="flex truncate font-medium text-white text-xs" style={{maxWidth: '110px', display: 'inline-block'}}>
                                                        {row.wallet_name || `Wallet${row.id === 1 ? '1' : '2'}`}
                                                    </div>
                                                    <div className="ml-0 lg:ml-1 flex items-center cursor-pointer text-gray-400">
                                                        <Edit className="w-3 h-3 text-gray-400 hover:text-white" />
                                                    </div>
                                                </div>
                                                {/* Wallet Address and Copy */}
                                                <div className="flex items-center gap-1 text-xs">
                                                    <a 
                                                        target="_blank" 
                                                        className="text-second-font-color hover:border-b-[0.5px] border-b-solid border-b-white" 
                                                        rel="noopener noreferrer" 
                                                        href={`/sol/address/${row.wallet_info}`}
                                                    >
                                                        {row.wallet_info.slice(0, 4)}...{row.wallet_info.slice(-4)}
                                                    </a>
                                                    <span className="cursor-pointer ml-[-1px] w-5 h-6 flex items-center justify-center">
                                                        <Copy className="w-3 h-3 text-gray-400 hover:text-gray-300" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4">
                                        <span className="text-white text-xs">{row.vol}</span>
                                    </td>
                                    <td className="px-4">
                                        <span className="text-white text-xs">{row.tokens}</span>
                                    </td>
                                    <td className="px-4">
                                        <div className="flex flex-nowrap items-center gap-1 text-[14px]">
                                            <svg width="16" height="16" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                                                <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                                                <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                                                <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                                            </svg>
                                            <p className="text-nowrap text-white">0</p>
                                        </div>
                                    </td>
                                    <td className="px-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <a 
                                                target="_blank" 
                                                className="h-6 w-6 flex items-center justify-center" 
                                                rel="noopener noreferrer" 
                                                href={`/sol/address/${row.wallet_info}`}
                                            >
                                                <BarChart3 className="w-3.5 h-3.5 text-second-font-color hover:text-gray-300" />
                                            </a>
                                            <div className="flex">
                                                <div className="h-6 w-6 flex items-center justify-center cursor-pointer text-second-font-color hover:text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                                        <path d="m7.9522 5.5752 3.7568-4.295h2.2793L9.0078 6.9728l.5654.748h-.418c-.391 0-.7699.053-1.1298.1514l-4.0078-5.299H2.662l4.3691 5.713c-1.284.737-2.1493 2.1211-2.1494 3.7079 0 .0287.0014.0574.002.086l-2.3096 2.6396H.294l5.3272-6.0888L0 1.2803h4.7041z"></path>
                                                        <path d="M6.2763 12.0831c.0002-1.7726 1.4374-3.2097 3.21-3.21h.2607a.7.7 0 0 1 .6993.7003c0 .3865-.3128.7-.6993.7002h-.2607c-.9994.0001-1.8094.8101-1.8096 1.8095 0 .9996.81 1.8104 1.8096 1.8106h.2607a.7.7 0 0 1 .6993.7002c-.0002.3863-.3129.7-.6993.7002h-.2607c-1.7727-.0002-3.21-1.4382-3.21-3.211m8.2959 0c-.0002-.9995-.8109-1.8095-1.8105-1.8095h-.4277a.7.7 0 0 1-.6993-.7002.7.7 0 0 1 .6993-.7002h.4277c1.7728 0 3.2098 1.4372 3.2099 3.2099 0 1.7729-1.437 3.211-3.2099 3.211h-.4277c-.3863-.0003-.6991-.3139-.6993-.7002 0-.3865.3129-.7.6993-.7002h.4277c.9997 0 1.8105-.8109 1.8105-1.8106"></path>
                                                        <path d="M12.0766 11.3833a.7.7 0 0 1 .6992.7002c0 .3865-.3128.7-.6992.7002h-1.9043a.7003.7003 0 0 1-.7002-.7002.7003.7003 0 0 1 .7002-.7002z"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="h-6 w-6 flex items-center justify-center cursor-pointer text-second-font-color hover:text-white">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <button type="button" className="h-6 w-6 flex items-center justify-center">
                                                    <MoreHorizontal className="w-3.5 h-3.5 text-second-font-color hover:text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}