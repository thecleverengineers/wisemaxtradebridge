
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import SuperAdminPanel from "./pages/superadmin/SuperAdminPanel";

import Wallet from "./pages/Wallet";
import Referrals from "./pages/Referrals";
import Settings from "./pages/Settings";
import Calculator from "./pages/Calculator";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import InvestmentRecords from "./pages/InvestmentRecords";

import ForexTrading from "./pages/ForexTrading";
import USDTStaking from "./pages/USDTStaking";
import ROIInvestments from "./pages/ROIInvestments";
import BinaryOptions from "./pages/BinaryOptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/wallet" element={
        <PrivateRoute>
          <Wallet />
        </PrivateRoute>
      } />
      <Route path="/referrals" element={
        <PrivateRoute>
          <Referrals />
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      } />
      <Route path="/calculator" element={
        <PrivateRoute>
          <Calculator />
        </PrivateRoute>
      } />
      <Route path="/leaderboard" element={
        <PrivateRoute>
          <Leaderboard />
        </PrivateRoute>
      } />
      <Route path="/rewards" element={
        <PrivateRoute>
          <Rewards />
        </PrivateRoute>
      } />
      <Route path="/investment-records" element={
        <PrivateRoute>
          <InvestmentRecords />
        </PrivateRoute>
      } />
      <Route path="/forex-trading" element={
        <PrivateRoute>
          <ForexTrading />
        </PrivateRoute>
      } />
      <Route path="/usdt-staking" element={
        <PrivateRoute>
          <USDTStaking />
        </PrivateRoute>
      } />
      <Route path="/roi-investments" element={
        <PrivateRoute>
          <ROIInvestments />
        </PrivateRoute>
      } />
      <Route path="/superadmin" element={
        <PrivateRoute>
          <SuperAdminPanel />
        </PrivateRoute>
      } />
      <Route path="/binary-options" element={
        <PrivateRoute>
          <BinaryOptions />
        </PrivateRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
