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

    // Settle each trade with 40% win / 60% lose probability
    let settledCount = 0;
    for (const trade of expiredTrades) {
      const randomValue = Math.random();
      const isWin = randomValue <= 0.4; // 40% win chance
      
      // Calculate exit price based on win/lose and direction
      let exitPrice: number;
      let profitLoss: number;
      const stakeAmount = Number(trade.amount);
      const entryPrice = Number(trade.entry_price);
      const direction = trade.direction; // 'CALL' or 'PUT'
      
      if (isWin) {
        // Win: 90% payout (stake + 90% profit)
        profitLoss = stakeAmount * 0.9;
        
        // Adjust exit price to reflect win
        if (direction === 'CALL') {
          // CALL wins when price goes up
          exitPrice = entryPrice * (1 + (Math.random() * 0.02 + 0.01)); // +1% to +3%
        } else {
          // PUT wins when price goes down
          exitPrice = entryPrice * (1 - (Math.random() * 0.02 + 0.01)); // -1% to -3%
        }
      } else {
        // Lose: lose entire stake
        profitLoss = -stakeAmount;
        
        // Adjust exit price to reflect loss
        if (direction === 'CALL') {
          // CALL loses when price goes down or stays same
          exitPrice = entryPrice * (1 - (Math.random() * 0.02 + 0.005)); // -0.5% to -2.5%
        } else {
          // PUT loses when price goes up or stays same
          exitPrice = entryPrice * (1 + (Math.random() * 0.02 + 0.005)); // +0.5% to +2.5%
        }
      }
      
      const status = isWin ? 'won' : 'lost';
      const settledAt = new Date().toISOString();
      
      // Update the binary record
      const { error: updateError } = await supabase
        .from('binary_records')
        .update({ 
          exit_price: exitPrice,
          profit_loss: profitLoss,
          status: status,
          settled_at: settledAt,
          updated_at: settledAt
        })
        .eq('id', trade.id)
        .eq('status', 'pending'); // Only update if still pending

      if (updateError) {
        console.error(`Error updating trade ${trade.id}:`, updateError);
        continue;
      }

      // Update wallet balance
      // Fetch current wallet state first
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance, locked_balance')
        .eq('user_id', trade.user_id)
        .maybeSingle();

      if (walletFetchError || !wallet) {
        console.error(`Error fetching wallet for trade ${trade.id}:`, walletFetchError);
        continue;
      }

      let newBalance = wallet.balance;
      let newLockedBalance = wallet.locked_balance;

      if (isWin) {
        // Win: Return stake + profit to balance, reduce locked balance
        const totalReturn = stakeAmount + profitLoss;
        newBalance = wallet.balance + totalReturn;
        newLockedBalance = wallet.locked_balance - stakeAmount;
        
        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            locked_balance: newLockedBalance
          })
          .eq('user_id', trade.user_id);

        if (walletError) {
          console.error(`Error updating wallet for trade ${trade.id}:`, walletError);
          continue;
        }
      } else {
        // Lose: Just unlock the balance (amount already deducted)
        newLockedBalance = wallet.locked_balance - stakeAmount;
        
        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            locked_balance: newLockedBalance
          })
          .eq('user_id', trade.user_id);

        if (walletError) {
          console.error(`Error updating wallet for trade ${trade.id}:`, walletError);
          continue;
        }
      }

      // Create transaction record with correct balance_after
      await supabase
        .from('transactions')
        .insert({
          user_id: trade.user_id,
          type: isWin ? 'credit' : 'debit',
          amount: Math.abs(profitLoss),
          balance_after: newBalance,
          reason: `Binary trade ${status} - ${trade.asset} ${direction}`,
          category: 'binary_trading',
          status: 'completed'
        });

      settledCount++;
      console.log(`Settled trade ${trade.id}: ${direction} on ${trade.asset}, Result: ${status} (${(randomValue * 100).toFixed(1)}%), Entry: ${entryPrice}, Exit: ${exitPrice.toFixed(4)}, P/L: ${profitLoss.toFixed(2)}`);
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
