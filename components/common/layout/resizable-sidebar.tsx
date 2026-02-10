"use client";

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import SidebarTabs from "./sidebar-tabs";
import XTracker from "./x-tracker";

export default function ResizableSidebar() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <ResizablePanelGroup direction="vertical" className="h-full">
      <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
        <div className="h-full flex flex-col" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
          <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 overflow-auto p-4">
            <p className="text-xs text-muted-foreground" data-testid="text-sidebar-content">
              {activeTab === "All" && "All tokens and wallets"}
              {activeTab === "Wallet" && "Your watched wallets"}
              {activeTab === "Track" && "Tracked tokens"}
              {activeTab === "Monitor" && "Monitored accounts"}
              {activeTab === "Renames" && "Recently renamed tokens"}
            </p>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle className="bg-gray-700 hover:bg-primary/20" data-testid="handle-resize-vertical" />

      <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
        <div style={{ backgroundColor: 'rgb(12, 12, 15)' }} className="h-full">
          <XTracker />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
