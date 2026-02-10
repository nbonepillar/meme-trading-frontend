'use client';

import VirtualTokenList from '@/components/features/token/virtual-token-list';
import TrenchPanelHeader from '@/components/features/trench/trench-panel-header';
import { Button } from '@/components/ui/button';
import { ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useTrenchesWebSocket } from '@/hooks/useTrenchesWebSocket';
import { useTokenStore } from '@/store/tokenStore';
import { useUIStore } from '@/store/uiStore';

const trenchMenuItems = [
    'Pump.fun',
    'Bonk',
    'Bags',
    'Heaven',
    'Believe',
    'Boop',
    'Launchlab',
    'Moonit',
];

export function TrenchesClient() {
    // Use new trenches WebSocket hook
    useTrenchesWebSocket();

    // Optimized UI store selectors - only subscribe to what we need
    const showTrenchMenu = useUIStore((state) => state.showTrenchMenu);
    const setShowTrenchMenu = useUIStore((state) => state.setShowTrenchMenu);
    const setSelectedTrench = useUIStore((state) => state.setSelectedTrench);
    const setHoveredPanel = useUIStore((state) => state.setHoveredPanel);
    
    // Optimized token store selectors - only subscribe to what we need
    const newTokensArray = useTokenStore((state) => state.newTokensArray);
    const almostBondedTokensArray = useTokenStore((state) => state.almostBondedTokensArray);
    const migratedTokensArray = useTokenStore((state) => state.migratedTokensArray);
    const isConnected = useTokenStore((state) => state.isConnected);
    const error = useTokenStore((state) => state.error);

    // Get hoveredPanel separately to avoid re-renders in main component
    const hoveredPanel = useUIStore((state) => state.hoveredPanel);

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 px-[10px] overflow-hidden">
                <div className="h-full flex rounded-[5px] overflow-hidden" style={{ backgroundColor: 'rgb(17, 18, 20)', border: '1px solid rgb(39, 40, 46)' }}>
                    <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid rgb(39, 40, 46)' }}>
                        <TrenchPanelHeader title="New" isPaused={hoveredPanel === 'new'} />
                        <VirtualTokenList
                            panelId="new"
                            tokens={newTokensArray}
                            onHoverChange={(isHovered) => setHoveredPanel(isHovered ? 'new' : null)}
                        />
                    </div>

                    <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid rgb(39, 40, 46)' }}>
                        <TrenchPanelHeader title="Almost Bonded" isPaused={hoveredPanel === 'almost_bonded'} />
                        <VirtualTokenList
                            panelId="almost_bonded"
                            tokens={almostBondedTokensArray}
                            onHoverChange={(isHovered) => setHoveredPanel(isHovered ? 'almost_bonded' : null)}
                        />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <TrenchPanelHeader title="Migrated" isPaused={hoveredPanel === 'migrated'} />
                        <VirtualTokenList
                            panelId="migrated"
                            tokens={migratedTokensArray}
                            onHoverChange={(isHovered) => setHoveredPanel(isHovered ? 'migrated' : null)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
