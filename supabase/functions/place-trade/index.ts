import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth from request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { signalType, amount } = await req.json()

    // Validate amount
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid trade amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get current wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('currency', 'USDT')
      .single()

    if (!wallet || wallet.balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Insufficient balance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the current active signal
    const { data: currentSignal } = await supabase
      .from('binary_signals')
      .select('signal_type')
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Determine win/loss
    const isWin = currentSignal && currentSignal.signal_type === signalType
    const result = isWin ? 'WIN' : 'LOSE'
    const payout = isWin ? amount * 2 : 0
    const newBalance = wallet.balance - amount + payout

    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', user.id)
      .eq('currency', 'USDT')

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'binary_trade',
        category: 'trading',
        currency: 'USDT',
        amount: amount,
        status: 'completed',
        notes: `Binary trade: ${signalType} - ${result}`
      })

    // Create binary trade record
    const entryPrice = 1.0800 + (Math.random() * 0.02)
    const exitPrice = isWin 
      ? (signalType === 'CALL' ? entryPrice + 0.001 : entryPrice - 0.001)
      : (signalType === 'CALL' ? entryPrice - 0.001 : entryPrice + 0.001)

    await supabase
      .from('binary_options_trades')
      .insert({
        user_id: user.id,
        asset_pair: 'EUR/USD',
        trade_type: signalType,
        stake_amount: amount,
        entry_price: entryPrice,
        exit_price: exitPrice,
        expiry_time: new Date(Date.now() + 60000).toISOString(),
        status: isWin ? 'won' : 'lost',
        profit_loss: isWin ? amount : -amount,
        settled_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        result,
        newBalance,
        profit: isWin ? amount : -amount,
        signalType,
        amount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})