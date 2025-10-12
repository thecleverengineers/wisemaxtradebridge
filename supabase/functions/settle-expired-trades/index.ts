import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting settlement of expired trades...');

    // Get all expired pending trades
    const { data: expiredTrades, error: fetchError } = await supabase
      .from('binary_records')
      .select('*')
      .eq('status', 'pending')
      .lte('expiry_time', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired trades:', fetchError);
      throw fetchError;
    }

    if (!expiredTrades || expiredTrades.length === 0) {
      console.log('No expired trades to settle');
      return new Response(
        JSON.stringify({ message: 'No expired trades to settle', settled: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredTrades.length} expired trades to settle`);

    // Settle each trade
    let settledCount = 0;
    for (const trade of expiredTrades) {
      // Simulate current market price (slightly different from entry price)
      const priceMovement = (Math.random() - 0.5) * 0.015; // ±0.75% movement
      const exitPrice = trade.entry_price * (1 + priceMovement);

      // Update the trade with exit price - the trigger will handle the rest
      const { error: updateError } = await supabase
        .from('binary_records')
        .update({ 
          exit_price: exitPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', trade.id)
        .eq('status', 'pending'); // Only update if still pending

      if (updateError) {
        console.error(`Error updating trade ${trade.id}:`, updateError);
      } else {
        settledCount++;
        console.log(`Settled trade ${trade.id}: ${trade.trade_type} on ${trade.asset_pair}, Entry: ${trade.entry_price}, Exit: ${exitPrice}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully processed ${settledCount} expired trades`,
        settled: settledCount,
        total: expiredTrades.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in settle-expired-trades:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
