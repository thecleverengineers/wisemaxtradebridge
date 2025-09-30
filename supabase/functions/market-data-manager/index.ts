import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { action, stockId, data } = await req.json();
    console.log('Market data manager action:', action);

    switch (action) {
      case 'update-prices': {
        // Update all stock prices with realistic market movements
        const { data: stocks, error: fetchError } = await supabaseClient
          .from('stocks')
          .select('*');

        if (fetchError) throw fetchError;

        const updates = stocks.map(stock => {
          // Generate realistic price movements (±0.5% to ±2% change)
          const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
          const priceChange = stock.price * (changePercent / 100);
          const newPrice = Math.max(0.01, stock.price + priceChange);
          
          // Update volume with random variation (80% to 120% of current)
          const volumeMultiplier = 0.8 + Math.random() * 0.4;
          const newVolume = Math.floor(stock.volume * volumeMultiplier);
          
          // Update day high/low
          const dayHigh = Math.max(stock.day_high || newPrice, newPrice);
          const dayLow = Math.min(stock.day_low || newPrice, newPrice);

          return {
            id: stock.id,
            price: parseFloat(newPrice.toFixed(2)),
            previous_close: stock.price,
            change_amount: parseFloat(priceChange.toFixed(2)),
            change_percent: parseFloat(changePercent.toFixed(2)),
            volume: newVolume,
            day_high: parseFloat(dayHigh.toFixed(2)),
            day_low: parseFloat(dayLow.toFixed(2)),
            last_updated: new Date().toISOString(),
          };
        });

        // Batch update all stocks
        for (const update of updates) {
          const { error: updateError } = await supabaseClient
            .from('stocks')
            .update(update)
            .eq('id', update.id);
          
          if (updateError) {
            console.error('Error updating stock:', update.id, updateError);
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Updated ${updates.length} stocks`,
            updates 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-single': {
        // Update a single stock price
        if (!stockId || !data) {
          throw new Error('stockId and data are required for single update');
        }

        const { error: updateError } = await supabaseClient
          .from('stocks')
          .update({
            ...data,
            last_updated: new Date().toISOString(),
          })
          .eq('id', stockId);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Stock updated successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add-stock': {
        // Add a new stock to the market
        if (!data) {
          throw new Error('Stock data is required');
        }

        const { error: insertError } = await supabaseClient
          .from('stocks')
          .insert({
            ...data,
            day_high: data.price,
            day_low: data.price,
            previous_close: data.price,
            change_amount: 0,
            change_percent: 0,
            last_updated: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Stock added successfully' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'simulate-trading-hours': {
        // Simulate market hours with periodic updates
        const marketOpen = 9 * 60; // 9:00 AM in minutes
        const marketClose = 15.5 * 60; // 3:30 PM in minutes
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const isMarketOpen = currentMinutes >= marketOpen && currentMinutes <= marketClose;
        
        if (isMarketOpen) {
          // During market hours, generate more volatile movements
        const { data: stocks } = await supabaseClient
          .from('stocks')
          .select('*');

        const updates = (stocks || []).map(stock => {
            // Higher volatility during market hours (±3%)
            const changePercent = (Math.random() - 0.5) * 6;
            const priceChange = stock.price * (changePercent / 100);
            const newPrice = Math.max(0.01, stock.price + priceChange);
            
            return {
              id: stock.id,
              price: parseFloat(newPrice.toFixed(2)),
              change_amount: parseFloat((newPrice - stock.previous_close).toFixed(2)),
              change_percent: parseFloat((((newPrice - stock.previous_close) / stock.previous_close) * 100).toFixed(2)),
              volume: stock.volume + Math.floor(Math.random() * 10000),
              day_high: Math.max(stock.day_high || newPrice, newPrice),
              day_low: Math.min(stock.day_low || newPrice, newPrice),
              last_updated: new Date().toISOString(),
            };
          });

          for (const update of updates) {
            await supabaseClient
              .from('stocks')
              .update(update)
              .eq('id', update.id);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Market data updated (trading hours)',
              isMarketOpen: true 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Market closed',
              isMarketOpen: false 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'reset-daily': {
        // Reset daily metrics (run at market open)
        const { data: stocks } = await supabaseClient
          .from('stocks')
          .select('*');

        const updates = (stocks || []).map(stock => ({
          id: stock.id,
          previous_close: stock.price,
          day_high: stock.price,
          day_low: stock.price,
          change_amount: 0,
          change_percent: 0,
          volume: 0,
          last_updated: new Date().toISOString(),
        }));

        for (const update of updates) {
          await supabaseClient
            .from('stocks')
            .update(update)
            .eq('id', update.id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Daily metrics reset' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in market-data-manager:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});