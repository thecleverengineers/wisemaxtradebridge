
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TradingPlatform from "./pages/TradingPlatform";
import ForexTrading from "./pages/ForexTrading";
import Invest from "./pages/Invest";
import Wallet from "./pages/Wallet";
import Referrals from "./pages/Referrals";
import Settings from "./pages/Settings";
import Calculator from "./pages/Calculator";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import InvestmentRecords from "./pages/InvestmentRecords";
import IntradayTrading from "./pages/IntradayTrading";
import MT5Trading from "./pages/MT5Trading";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/trading" element={<TradingPlatform />} />
            <Route path="/forex-trading" element={<ForexTrading />} />
            <Route path="/invest" element={<Invest />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/investment-records" element={<InvestmentRecords />} />
            <Route path="/intraday-trading" element={<IntradayTrading />} />
            <Route path="/mt5-trading" element={<MT5Trading />} />
            <Route path="/admin/*" element={<AdminPanel />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
