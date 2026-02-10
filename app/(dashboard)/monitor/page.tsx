export default function MonitorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
          Monitor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor wallet activities and insider trades
        </p>
      </div>

      <div className="p-8 border border-border rounded-md text-center" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
        <p className="text-muted-foreground">Monitor dashboard will be displayed here</p>
      </div>
    </div>
  );
}
