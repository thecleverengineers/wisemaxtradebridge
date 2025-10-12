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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Processing monthly salaries...');

    // Get all users with achievement progress
    const { data: progressData, error: progressError } = await supabaseClient
      .from('user_achievement_progress')
      .select('*')
      .eq('is_claimed', true)
      .not('tier_reached_at', 'is', null);

    if (progressError) {
      console.error('Error fetching achievement progress:', progressError);
      throw progressError;
    }

    const results = [];

    for (const progress of progressData || []) {
      const { user_id, tier_reached_at, achievement_id } = progress;

      // Get achievement details to determine tier
      const { data: achievement } = await supabaseClient
        .from('team_achievements')
        .select('name')
        .eq('id', achievement_id)
        .single();

      if (!achievement) continue;

      const tier = achievement.name;
      
      // Calculate how many months since tier was reached
      const tierReachedDate = new Date(tier_reached_at);
      const now = new Date();
      const monthsSinceTier = Math.floor((now.getTime() - tierReachedDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

      // Only process if within 6 months
      if (monthsSinceTier >= 6) continue;

      // Check if payment for this month already exists
      const currentMonth = monthsSinceTier + 1;
      
      const { data: existingPayment } = await supabaseClient
        .from('salary_payments')
        .select('*')
        .eq('user_id', user_id)
        .eq('achievement_tier', tier)
        .eq('payment_month', currentMonth)
        .maybeSingle();

      if (existingPayment) {
        console.log(`Payment already exists for user ${user_id}, tier ${tier}, month ${currentMonth}`);
        continue;
      }

      // Check if it's time for next payment (30 days since last payment or tier reached)
      const { data: lastPayment } = await supabaseClient
        .from('salary_payments')
        .select('*')
        .eq('user_id', user_id)
        .eq('achievement_tier', tier)
        .order('payment_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastPaymentDate = lastPayment ? new Date(lastPayment.paid_at) : tierReachedDate;
      const daysSinceLastPayment = Math.floor((now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastPayment < 30) {
        console.log(`Not yet time for next payment for user ${user_id}, tier ${tier}`);
        continue;
      }

      // Get salary amount for tier
      const { data: salaryData } = await supabaseClient
        .rpc('get_tier_salary_amount', { p_tier: tier });

      const salaryAmount = salaryData || 0;

      if (salaryAmount === 0) continue;

      // Create salary payment record
      const { error: paymentError } = await supabaseClient
        .from('salary_payments')
        .insert({
          user_id,
          achievement_tier: tier,
          amount: salaryAmount,
          payment_month: currentMonth,
          tier_reached_at,
          paid_at: new Date().toISOString()
        });

      if (paymentError) {
        console.error(`Error creating salary payment for user ${user_id}:`, paymentError);
        continue;
      }

      // Update user wallet
      const { data: wallet } = await supabaseClient
        .from('wallets')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (wallet) {
        const newBalance = parseFloat(wallet.balance.toString()) + salaryAmount;
        
        await supabaseClient
          .from('wallets')
          .update({
            balance: newBalance,
            bonus_income: parseFloat(wallet.bonus_income.toString()) + salaryAmount
          })
          .eq('user_id', user_id);

        // Create transaction record
        await supabaseClient
          .from('transactions')
          .insert({
            user_id,
            type: 'credit',
            amount: salaryAmount,
            balance_after: newBalance,
            category: 'salary',
            income_type: 'monthly_salary',
            reason: `Monthly salary payment - ${tier} tier (Month ${currentMonth}/6)`,
            status: 'completed'
          });

        results.push({
          user_id,
          tier,
          amount: salaryAmount,
          month: currentMonth
        });

        console.log(`Processed salary payment for user ${user_id}: $${salaryAmount} (${tier} - Month ${currentMonth})`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        payments: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing salaries:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
