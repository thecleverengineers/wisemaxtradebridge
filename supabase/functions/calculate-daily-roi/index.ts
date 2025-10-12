import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Investment {
  id: string;
  user_id: string;
  amount: number;
  total_roi_earned: number;
  total_roi_cap: number;
  roi_completed: boolean;
  investment_plans: {
    daily_roi: number;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily ROI calculation...');

    // Fetch all active investments that haven't reached 2x cap
    const { data: investments, error: fetchError } = await supabase
      .from('user_investments')
      .select(`
        id,
        user_id,
        amount,
        total_roi_earned,
        total_roi_cap,
        roi_completed,
        investment_plans (
          daily_roi
        )
      `)
      .eq('status', 'active')
      .eq('roi_completed', false);

    if (fetchError) {
      console.error('Error fetching investments:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${investments?.length || 0} active investments to process`);

    let processedCount = 0;
    let completedCount = 0;

    for (const investment of investments as Investment[]) {
      // Calculate daily ROI (0.3% = 0.003)
      const dailyRoi = investment.amount * 0.003;
      const newTotalRoi = investment.total_roi_earned + dailyRoi;

      // Check if this would exceed the 2x cap
      const isCompleting = newTotalRoi >= investment.total_roi_cap;
      const finalRoi = isCompleting ? investment.total_roi_cap : newTotalRoi;
      const actualDailyRoi = finalRoi - investment.total_roi_earned;

      // Update investment record
      const { error: updateInvestmentError } = await supabase
        .from('user_investments')
        .update({
          total_roi_earned: finalRoi,
          roi_completed: isCompleting,
          roi_completion_date: isCompleting ? new Date().toISOString() : null,
          last_payout_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', investment.id);

      if (updateInvestmentError) {
        console.error(`Error updating investment ${investment.id}:`, updateInvestmentError);
        continue;
      }

      // Get current wallet balance
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('roi_income, total_balance')
        .eq('user_id', investment.user_id)
        .single();

      if (walletFetchError) {
        console.error(`Error fetching wallet for user ${investment.user_id}:`, walletFetchError);
        continue;
      }

      // Update user's wallet with incremented values
      const { error: updateWalletError } = await supabase
        .from('wallets')
        .update({
          roi_income: wallet.roi_income + actualDailyRoi,
          total_balance: wallet.total_balance + actualDailyRoi,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', investment.user_id);

      if (updateWalletError) {
        console.error(`Error updating wallet for user ${investment.user_id}:`, updateWalletError);
        continue;
      }

      // Create income transaction record
      const { error: transactionError } = await supabase
        .from('income_transactions')
        .insert({
          user_id: investment.user_id,
          income_type: 'roi',
          amount: actualDailyRoi,
          description: isCompleting 
            ? `Final ROI payout - investment completed (2x cap reached)`
            : `Daily ROI (0.3%) from investment of $${investment.amount}`,
        });

      if (transactionError) {
        console.error(`Error creating transaction for user ${investment.user_id}:`, transactionError);
      }

      processedCount++;
      if (isCompleting) {
        completedCount++;
        console.log(`Investment ${investment.id} completed - reached 2x cap`);
      }
    }

    console.log(`ROI calculation complete. Processed: ${processedCount}, Completed: ${completedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily ROI calculated for ${processedCount} investments`,
        completed: completedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in calculate-daily-roi:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
