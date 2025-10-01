import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory storage for last signal
let lastSignal: any = null
let lastSignalTime: number = 0

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate new signal if needed
    const now = Date.now()
    const SIGNAL_EXPIRY = 15000 // 15 seconds

    if (!lastSignal || (now - lastSignalTime) > SIGNAL_EXPIRY) {
      const signalType = Math.random() > 0.5 ? 'CALL' : 'PUT'
      const assetPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP']
      const randomPair = assetPairs[Math.floor(Math.random() * assetPairs.length)]
      const strengthOptions = ['weak', 'medium', 'strong']
      const strength = strengthOptions[Math.floor(Math.random() * strengthOptions.length)]
      
      lastSignal = {
        id: crypto.randomUUID(),
        type: signalType,
        asset_pair: randomPair,
        strength: strength,
        timestamp: new Date().toISOString(),
        expires_at: new Date(now + SIGNAL_EXPIRY).toISOString()
      }
      lastSignalTime = now

      // Also store in database for persistence
      await supabase
        .from('binary_signals')
        .insert({
          asset_pair: lastSignal.asset_pair,
          signal_type: lastSignal.type,
          strength: lastSignal.strength,
          expires_at: lastSignal.expires_at,
          is_active: true
        })

      // Deactivate old signals
      await supabase
        .from('binary_signals')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
    }

    return new Response(
      JSON.stringify({ signal: lastSignal }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})