import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, TrendingUp, TrendingDown, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: string;
  current_price: number;
  payout_rate: number;
  day_high?: number;
  day_low?: number;
  previous_close?: number;
}

interface AssetSelectorProps {
  selectedAsset: Asset | null;
  onSelectAsset: (asset: Asset) => void;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAsset,
  onSelectAsset
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchAssets();
    loadFavorites();
    
    // Set up real-time price updates
    const channel = supabase
      .channel('asset-prices')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'binary_assets'
      }, () => {
        fetchAssets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAssets = async () => {
    try {
      setError(null);
      console.log('Fetching binary assets...');
      
      const { data, error } = await supabase
        .from('binary_assets')
        .select('*')
        .eq('is_active', true)
        .order('symbol');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Assets fetched:', data?.length || 0, 'assets');
      setAssets(data || []);
      
      // Select first asset by default if none selected
      if (data && data.length > 0 && !selectedAsset) {
        onSelectAsset(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      setError(error.message || 'Failed to load assets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('binary_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (assetId: string) => {
    const newFavorites = favorites.includes(assetId)
      ? favorites.filter(id => id !== assetId)
      : [...favorites, assetId];
    
    setFavorites(newFavorites);
    localStorage.setItem('binary_favorites', JSON.stringify(newFavorites));
  };

  const calculatePriceChange = (asset: Asset) => {
    if (!asset.previous_close) return 0;
    return ((asset.current_price - asset.previous_close) / asset.previous_close) * 100;
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    // Favorites first
    const aFav = favorites.includes(a.id) ? 1 : 0;
    const bFav = favorites.includes(b.id) ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return 0;
  });

  const categories = ['all', 'forex', 'crypto', 'commodity'];

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-16 ml-auto" />
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={fetchAssets}
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : sortedAssets.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No assets found
              </div>
            ) : (
              sortedAssets.map(asset => {
                const priceChange = calculatePriceChange(asset);
                const isSelected = selectedAsset?.id === asset.id;
                const isFavorite = favorites.includes(asset.id);

                return (
                  <div
                    key={asset.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all",
                      "hover:bg-muted/50",
                      isSelected && "bg-primary/10 border border-primary"
                    )}
                    onClick={() => onSelectAsset(asset)}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(asset.id);
                        }}
                        className="text-muted-foreground hover:text-yellow-500 transition-colors"
                      >
                        <Star className={cn(
                          "h-4 w-4",
                          isFavorite && "fill-yellow-500 text-yellow-500"
                        )} />
                      </button>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{asset.symbol}</span>
                          <Badge variant="outline" className="text-xs">
                            {asset.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {asset.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        ${asset.current_price.toFixed(asset.current_price < 10 ? 4 : 2)}
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-sm",
                        priceChange >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {priceChange >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{Math.abs(priceChange).toFixed(2)}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Payout: {(asset.payout_rate * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};