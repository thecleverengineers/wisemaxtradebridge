import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: string;
  current_price: number;
  payout_rate: number;
  previous_close?: number;
  day_high?: number;
  day_low?: number;
}

interface Timeframe {
  id: string;
  name: string;
  duration_seconds: number;
  payout_multiplier: number;
  min_stake: number;
  max_stake: number;
}

interface BinaryDataContextType {
  assets: Asset[];
  timeframes: Timeframe[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const BinaryDataContext = createContext<BinaryDataContextType | undefined>(undefined);

export const BinaryDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [timeframes, setTimeframes] = useState<Timeframe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch both assets and timeframes in parallel
      const [assetsResponse, timeframesResponse] = await Promise.all([
        supabase
          .from('binary_assets')
          .select('*')
          .eq('is_active', true)
          .order('symbol'),
        supabase
          .from('binary_timeframes')
          .select('*')
          .eq('is_active', true)
          .order('duration_seconds')
      ]);

      if (assetsResponse.error) throw assetsResponse.error;
      if (timeframesResponse.error) throw timeframesResponse.error;

      setAssets(assetsResponse.data || []);
      setTimeframes(timeframesResponse.data || []);
    } catch (err: any) {
      console.error('Error fetching binary data:', err);
      setError(err.message || 'Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscriptions
    const assetsChannel = supabase
      .channel('binary_assets_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'binary_assets' },
        () => fetchData()
      )
      .subscribe();

    const timeframesChannel = supabase
      .channel('binary_timeframes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'binary_timeframes' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(timeframesChannel);
    };
  }, []);

  return (
    <BinaryDataContext.Provider value={{ assets, timeframes, loading, error, refetch: fetchData }}>
      {children}
    </BinaryDataContext.Provider>
  );
};

export const useBinaryData = () => {
  const context = useContext(BinaryDataContext);
  if (context === undefined) {
    throw new Error('useBinaryData must be used within a BinaryDataProvider');
  }
  return context;
};