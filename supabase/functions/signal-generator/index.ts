import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Asset pairs for trading
    const assetPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP'];
    
    // Generate multiple signals
    const signals = [];
    const numSignals = Math.floor(Math.random() * 2) + 2; // Generate 2-3 signals

    for (let i = 0; i < numSignals; i++) {
      const randomPair = assetPairs[Math.floor(Math.random() * assetPairs.length)];
      const signalType = Math.random() > 0.5 ? 'CALL' : 'PUT';
      const strengthRandom = Math.random();
      const strength = strengthRandom < 0.33 ? 'weak' : strengthRandom < 0.66 ? 'medium' : 'strong';
      
      // Signal expires in 30-60 seconds
      const expirySeconds = Math.floor(Math.random() * 30) + 30;
      const expiresAt = new Date(Date.now() + expirySeconds * 1000);

      signals.push({
        asset_pair: randomPair,
        signal_type: signalType,
        strength: strength,
        expires_at: expiresAt.toISOString(),
        is_active: true
      });
    }

    // Deactivate old signals for the same asset pairs
    const pairsToUpdate = [...new Set(signals.map(s => s.asset_pair))];
    
    for (const pair of pairsToUpdate) {
      await supabase
        .from('binary_signals')
        .update({ is_active: false })
        .eq('asset_pair', pair)
        .eq('is_active', true);
    }

    // Insert new signals
    const { data, error } = await supabase
      .from('binary_signals')
      .insert(signals)
      .select();

    if (error) {
      console.error('Error inserting signals:', error);
      throw error;
    }

    console.log(`Generated ${signals.length} new trading signals`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        signals: data,
        message: `Generated ${signals.length} new signals` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Signal generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});