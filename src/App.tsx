
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import Invest from "./pages/Invest";
import Wallet from "./pages/Wallet";
import Referrals from "./pages/Referrals";
import Settings from "./pages/Settings";
import Calculator from "./pages/Calculator";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import InvestmentRecords from "./pages/InvestmentRecords";
import IntradayTrading from "./pages/IntradayTrading";
import ForexTrading from "./pages/ForexTrading";
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
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/invest" element={<ProtectedRoute><Invest /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
            <Route path="/investment-records" element={<ProtectedRoute><InvestmentRecords /></ProtectedRoute>} />
            <Route path="/intraday-trading" element={<ProtectedRoute><IntradayTrading /></ProtectedRoute>} />
            <Route path="/forex-trading" element={<ProtectedRoute><ForexTrading /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
