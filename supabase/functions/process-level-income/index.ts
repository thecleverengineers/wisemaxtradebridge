import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LEVEL_RATES = [
  { level: 1, percentage: 0.15, requiredReferrals: 1 },
  { level: 2, percentage: 0.12, requiredReferrals: 2 },
  { level: 3, percentage: 0.10, requiredReferrals: 3 },
  { level: 4, percentage: 0.08, requiredReferrals: 4 },
  { level: 5, percentage: 0.05, requiredReferrals: 5 },
  { level: 6, percentage: 0.05, requiredReferrals: 5 },
  { level: 7, percentage: 0.05, requiredReferrals: 5 },
  { level: 8, percentage: 0.03, requiredReferrals: 6 },
  { level: 9, percentage: 0.03, requiredReferrals: 6 },
  { level: 10, percentage: 0.03, requiredReferrals: 6 },
  { level: 11, percentage: 0.02, requiredReferrals: 7 },
  { level: 12, percentage: 0.02, requiredReferrals: 7 },
  { level: 13, percentage: 0.02, requiredReferrals: 7 },
  { level: 14, percentage: 0.02, requiredReferrals: 7 },
  { level: 15, percentage: 0.02, requiredReferrals: 7 },
  { level: 16, percentage: 0.01, requiredReferrals: 8 },
  { level: 17, percentage: 0.01, requiredReferrals: 8 },
  { level: 18, percentage: 0.01, requiredReferrals: 8 },
  { level: 19, percentage: 0.01, requiredReferrals: 8 },
  { level: 20, percentage: 0.01, requiredReferrals: 8 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { investmentId, userId, amount } = await req.json();

    console.log(`Processing level income for investment ${investmentId}, user ${userId}, amount ${amount}`);

    // Get user's upline chain (up to 20 levels)
    let currentUserId = userId;
    let level = 1;
    let totalProcessed = 0;

    while (level <= 20 && currentUserId) {
      // Get referrer
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referrer_id')
        .eq('id', currentUserId)
        .single();

      if (profileError || !profile?.referrer_id) {
        console.log(`No referrer found at level ${level}`);
        break;
      }

      const referrerId = profile.referrer_id;

      // Check if referrer is qualified for this level
      const { data: qualification, error: qualError } = await supabase
        .from('user_level_qualifications')
        .select('is_qualified')
        .eq('user_id', referrerId)
        .eq('level', level)
        .single();

      if (qualError || !qualification?.is_qualified) {
        console.log(`User ${referrerId} not qualified for level ${level}`);
        currentUserId = referrerId;
        level++;
        continue;
      }

      // Calculate commission
      const rate = LEVEL_RATES.find(r => r.level === level);
      if (!rate) {
        console.log(`No rate found for level ${level}`);
        break;
      }

      const commission = amount * rate.percentage;

      // Get current wallet balance
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('level_income, total_balance')
        .eq('user_id', referrerId)
        .single();

      if (walletFetchError) {
        console.error(`Error fetching wallet for user ${referrerId}:`, walletFetchError);
        currentUserId = referrerId;
        level++;
        continue;
      }

      // Update referrer's wallet with incremented values
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          level_income: wallet.level_income + commission,
          total_balance: wallet.total_balance + commission,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', referrerId);

      if (walletError) {
        console.error(`Error updating wallet for user ${referrerId}:`, walletError);
      } else {
        // Create income transaction
        await supabase
          .from('income_transactions')
          .insert({
            user_id: referrerId,
            income_type: 'level_income',
            amount: commission,
            source_user_id: userId,
            level: level,
            description: `Level ${level} income (${rate.percentage * 100}%) from $${amount} investment`,
          });

        totalProcessed++;
        console.log(`Credited $${commission} to ${referrerId} at level ${level}`);
      }

      currentUserId = referrerId;
      level++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed level income for ${totalProcessed} levels`,
        levelsProcessed: totalProcessed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in process-level-income:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
