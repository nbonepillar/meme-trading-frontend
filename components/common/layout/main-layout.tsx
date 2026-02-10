"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import TopBar from "@/components/common/layout/top-bar";
import SubBar from "@/components/common/layout/sub-bar";
import BottomBar from "@/components/common/layout/bottom-bar";
import ResizableSidebar from "@/components/common/layout/resizable-sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export default function MainLayout({ children, noPadding = false }: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'rgb(12, 12, 15)' }}>
      <TopBar />

      <div className="flex-1 overflow-hidden" style={{ marginBottom: '30px' }}>
        <ResizablePanelGroup direction="horizontal">
          <ResizableHandle withHandle className="hover:bg-primary/20" style={{ backgroundColor: 'rgb(39, 40, 46)' }} data-testid="handle-resize-horizontal" />

          <ResizablePanel defaultSize={75}>
            <div className={`h-full`}>
              {children}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <BottomBar />
    </div>
  );
}
