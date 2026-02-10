"use client";

import { useState } from "react";

export default function SubBar() {
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [selectedChain, setSelectedChain] = useState("SOL");

    return (
        <div className="fixed top-[60px] left-0 right-0 h-[28px] z-40 flex items-center px-4 py-[3px] gap-2" style={{ backgroundColor: 'rgb(12, 12, 15)', borderTop: '1px solid rgb(39, 40, 46)', borderBottom: '1px solid rgb(39, 40, 46)' }}>
            {/* Settings Icon */}
            <div className="cursor-pointer text-gray-400 hover:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.292-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.292c.415.764-.42 1.6-1.185 1.184l-.292-.159a1.873 1.873 0 0 0-2.692 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.693-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.292A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                </svg>
            </div>

            {/* Divider */}
            <div className="h-3 w-[1px]" style={{ backgroundColor: 'rgb(39, 40, 46)' }}></div>

            {/* Star and Chart Icons */}
            <div className="flex items-center gap-3">
                <div className="cursor-pointer text-yellow-400 hover:text-yellow-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M7.171 1.0037c.3392-.6871 1.319-.6871 1.6582 0l1.642 3.3271a.925.925 0 0 0 .6961.5058l3.6717.5335c.7584.1102 1.0611 1.042.5124 1.577l-2.6569 2.5898a.925.925 0 0 0-.2658.8183l.6272 3.6569c.1295.7552-.6632 1.3312-1.3415.9746l-3.284-1.7266a.925.925 0 0 0-.8605 0l-3.284 1.7266c-.6783.3566-1.471-.2194-1.3415-.9746l.6272-3.6569a.925.925 0 0 0-.2659-.8183L.649 6.947C.1 6.412.4029 5.4803 1.1612 5.37l3.6718-.5335a.925.925 0 0 0 .696-.5058z"></path>
                    </svg>
                </div>
                <div className="cursor-pointer text-gray-400 hover:text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.789 2.0473a.5.5 0 0 1 .5-.5h1.318a.5.5 0 0 1 .5.5v11.3338a.5.5 0 0 1-.5.5H1.289a.5.5 0 0 1-.5-.5z"></path>
                        <path d="M.789 14.379a.5.5 0 0 0 .5.5h13.4217a.5.5 0 0 0 .5-.5v-1.2474a.5.5 0 0 0-.5-.5H1.2891a.5.5 0 0 0-.5.5z"></path>
                        <path d="M14.8574 3.6087a.5.5 0 0 1 0 .7071L9.9042 9.269a.5.5 0 0 1-.707 0L7.7395 7.8115l-2.181 2.181a.5.5 0 0 1-.7071 0l-.9197-.9197a.5.5 0 0 1 0-.7071L7.386 4.9115a.5.5 0 0 1 .707 0l1.4576 1.4574 3.6799-3.6798a.5.5 0 0 1 .7071 0z"></path>
                    </svg>
                </div>
            </div>

            {/* Divider */}
            <div className="h-3 w-[1px]" style={{ backgroundColor: 'rgb(39, 40, 46)' }}></div>

            {/* Chain Selector */}
            <div className="mt-0.5">
                <div className="relative">
                    <select 
                        value={selectedChain}
                        onChange={(e) => setSelectedChain(e.target.value)}
                        className="appearance-none bg-transparent text-transparent text-xs h-[18px] pl-4 pr-4 cursor-pointer focus:outline-none w-[42px]"
                    >
                        <option value="SOL">SOL</option>
                        <option value="ETH">ETH</option>
                        <option value="BSC">BSC</option>
                    </select>
                    <div className="absolute right-1 top-[7px] pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 12 12" fill="currentColor" className="text-gray-400">
                            <path fillRule="evenodd" d="M1.4697 3.4697a.75.75 0 0 1 1.0606 0L6 6.9393l3.4697-3.4696a.75.75 0 1 1 1.0606 1.0606l-4 4a.75.75 0 0 1-1.0606 0l-4-4a.75.75 0 0 1 0-1.0606" clipRule="evenodd"></path>
                        </svg>
                    </div>
                    <div className="flex items-center justify-center absolute left-0 top-[2px] w-full pointer-events-none">
                        <svg width="14" height="14" viewBox="0 0 397.7 311.7" fill="currentColor" className="text-purple-400">
                            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                            <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                            <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Filter Selector */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                    <div className="relative">
                        <select 
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="appearance-none bg-transparent text-gray-400 text-xs h-6 pl-0 pr-4 cursor-pointer focus:outline-none"
                        >
                            <option value="All">All</option>
                            <option value="Wallet">Wallet</option>
                            <option value="Track">Track</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Renames">Renames</option>
                        </select>
                        <div className="absolute right-0 top-[6px] pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 12 12" fill="currentColor" className="text-gray-400">
                                <path fillRule="evenodd" d="M1.4697 3.4697a.75.75 0 0 1 1.0606 0L6 6.9393l3.4697-3.4696a.75.75 0 1 1 1.0606 1.0606l-4 4a.75.75 0 0 1-1.0606 0l-4-4a.75.75 0 0 1 0-1.0606" clipRule="evenodd"></path>
                            </svg>
                        </div>
                    </div>

                    {/* Scrollable Filter Tags Area */}
                    <div className="relative w-full min-w-0 flex-1 pr-[50px]">
                        <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden transition-all">
                            <div className="inline-flex">
                                <div className="inline-flex gap-1">
                                    {/* Filter tags would go here - currently empty like in GMGN */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
