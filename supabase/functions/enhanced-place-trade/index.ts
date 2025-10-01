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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { assetId, timeframeId, signalType, amount, isDemoMode, payoutRate, marketMode } = await req.json()

    // Get asset details
    const { data: asset } = await supabase
      .from('binary_assets')
      .select('*')
      .eq('id', assetId)
      .single()

    // Get timeframe details
    const { data: timeframe } = await supabase
      .from('binary_timeframes')
      .select('*')
      .eq('id', timeframeId)
      .single()

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', 'USDT')
      .single()

    const currentBalance = isDemoMode ? wallet.demo_balance : wallet.balance
    if (currentBalance < amount) {
      throw new Error('Insufficient balance')
    }

    // Calculate expiry time
    const expiryTime = new Date(Date.now() + timeframe.duration_seconds * 1000)

    // Determine outcome based on market mode
    let willWin = false
    if (marketMode === 'random') {
      willWin = Math.random() > 0.5
    } else if (marketMode === 'signal') {
      willWin = Math.random() > 0.45 // Slightly favor house
    }

    // Create trade
    const { data: trade, error: tradeError } = await supabase
      .from('binary_options_trades')
      .insert({
        user_id: user.id,
        asset_pair: asset.symbol,
        asset_id: assetId,
        timeframe_id: timeframeId,
        trade_type: signalType,
        stake_amount: amount,
        entry_price: asset.current_price,
        expiry_time: expiryTime,
        payout_rate: payoutRate,
        is_demo: isDemoMode,
        outcome_type: marketMode,
        status: 'pending'
      })
      .select()
      .single()

    if (tradeError) throw tradeError

    // Update wallet balance
    if (isDemoMode) {
      await supabase
        .from('wallets')
        .update({ demo_balance: wallet.demo_balance - amount })
        .eq('id', wallet.id)
    } else {
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance - amount })
        .eq('id', wallet.id)
    }

    // Set up auto-settlement after expiry
    setTimeout(async () => {
      const exitPrice = asset.current_price * (1 + (Math.random() - 0.5) * 0.01)
      const isWinner = willWin
      
      if (isWinner) {
        const payout = amount * (1 + payoutRate)
        
        if (isDemoMode) {
          await supabase
            .from('wallets')
            .update({ demo_balance: wallet.demo_balance + payout })
            .eq('id', wallet.id)
        } else {
          await supabase
            .from('wallets')
            .update({ balance: wallet.balance + payout })
            .eq('id', wallet.id)
        }
        
        await supabase
          .from('binary_options_trades')
          .update({
            status: 'won',
            exit_price: exitPrice,
            profit_loss: amount * payoutRate,
            settled_at: new Date()
          })
          .eq('id', trade.id)
      } else {
        await supabase
          .from('binary_options_trades')
          .update({
            status: 'lost',
            exit_price: exitPrice,
            profit_loss: -amount,
            settled_at: new Date()
          })
          .eq('id', trade.id)
      }
    }, timeframe.duration_seconds * 1000)

    return new Response(
      JSON.stringify({ success: true, trade }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})