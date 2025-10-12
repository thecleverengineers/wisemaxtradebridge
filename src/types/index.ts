// Shared type definitions across the application

export interface WalletData {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  locked_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  roi_income: number;
  referral_income: number;
  bonus_income: number;
  level_income: number;
  daily_task_income: number;
  daily_staking_income: number;
  monthly_salary: number;
  ultimate_bonoza: number;
  total_balance: number;
  wallet_address?: string;
  network?: string;
  last_transaction_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  description?: string;
  min_amount: number;
  max_amount: number;
  daily_roi: number;
  duration_days: number;
  total_return_percent: number;
  max_return_multiplier: number;
  status?: string;
  created_at?: string;
}

export interface UserInvestment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  start_date: string;
  end_date: string;
  status: string;
  total_roi_earned: number;
  total_roi_cap: number;
  roi_completed: boolean;
  roi_completion_date?: string;
  daily_roi_amount?: number;
  total_roi_expected?: number;
  roi_credited_days?: number;
  last_payout_date?: string;
  created_at: string;
  updated_at: string;
  investment_plans?: InvestmentPlan;
}

export interface InvestmentRecord extends UserInvestment {
  plan?: InvestmentPlan;
}

export interface ROIRecord {
  id: string;
  user_id: string;
  investment_id: string;
  amount: number;
  type: string;
  description?: string;
  roi_date?: string;
  credited_at?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  income_type: string;
  amount: number;
  balance_after: number;
  reason: string;
  created_at: string;
}

export interface ReferralBonus {
  id: string;
  user_id: string;
  from_user_id?: string;
  referral_id?: string;
  amount: number;
  level: number;
  bonus_type: string;
  base_amount?: number;
  percentage?: number;
  status?: string;
  created_at: string;
}