export default function RewardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
          Rewards
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earn rewards for using GMGN.AI platform
        </p>
      </div>

      <div className="p-8 border border-border rounded-md text-center" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
        <p className="text-muted-foreground">Rewards program will be displayed here</p>
      </div>
    </div>
  );
}
