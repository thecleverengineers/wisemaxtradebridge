-- Enable realtime for wallets table to update User Management in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;