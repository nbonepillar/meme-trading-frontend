import WalletTable from "@/components/portfolio/wallets";
import WalletActions from "@/components/portfolio/wallet-actions";
import PortfolioTabs from "@/components/portfolio/portfolio-tabs";

export default function Portfolio() {
  // Mock data for now - replace with real data later
  const mockRows = [
    {
      id: 1,
      wallet_info: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      vol: "0",
      tokens: "0",
      chain_id: "solana",
      wallet_name: "Wallet1",
      avatar: "/static/avator/301.png"
    },
    {
      id: 2,
      wallet_info: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      vol: "0",
      tokens: "0",
      chain_id: "solana",
      wallet_name: "Wallet 2",
      avatar: "/static/avator/87.png"
    }
  ];

  return (
    <div className="h-full flex flex-col bg-[#111214]">
      <div className="flex flex-1 overflow-hidden" style={{minWidth: '430px'}}>
        <div className="flex border-r border-custom-border">
          <WalletActions />
        </div>
        <div className="flex-1 flex flex-col border-t border-custom-border overflow-hidden">
          <PortfolioTabs />
        </div>
      </div>
    </div>
  );
}