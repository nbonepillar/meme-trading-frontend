import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";

//todo: remove mock functionality
const mockTrackedItems = [
  { id: 1, label: "P1", color: "bg-chart-1" },
  { id: 2, label: "P2", color: "bg-chart-2" },
  { id: 3, label: "P3", color: "bg-chart-3" },
];

export default function XTracker() {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'rgb(12, 12, 15)' }}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground" data-testid="text-xtracker-title">X Tracker</h3>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="button-xtracker-mine">
            Mine
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="button-xtracker-featured">
            Featured
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="button-xtracker-recommended">
            Recommended
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Only CA</span>
          <Switch data-testid="switch-only-ca" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {mockTrackedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-md bg-secondary hover-elevate cursor-pointer"
              data-testid={`card-tracked-${item.id}`}
            >
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs font-mono text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Log in to track wallets
        </p>
      </div>
    </div>
  );
}
