import { Button } from "@/components/ui/button";

interface SidebarTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ["Wallet", "Track", "Monitor", "Renames"];

export default function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <div className="p-4 border-b border-border" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(tab)}
            data-testid={`button-sidebar-${tab.toLowerCase()}`}
            className={activeTab === tab ? "bg-primary text-primary-foreground" : ""}
          >
            {tab}
          </Button>
        ))}
      </div>
    </div>
  );
}
