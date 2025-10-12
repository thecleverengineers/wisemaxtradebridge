// Income system type definitions

export type IncomeType = 
  | 'roi' 
  | 'direct_referral' 
  | 'level_income' 
  | 'daily_task' 
  | 'staking' 
  | 'monthly_salary' 
  | 'rewards' 
  | 'ultimate_bonoza';

export interface IncomeTransaction {
  id: string;
  user_id: string;
  income_type: IncomeType;
  amount: number;
  source_user_id?: string;
  level?: number;
  description?: string;
  created_at: string;
}

export interface LevelQualification {
  id: string;
  user_id: string;
  level: number;
  direct_referrals_required: number;
  direct_referrals_count: number;
  is_qualified: boolean;
  qualified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LevelCommissionRate {
  level: number;
  percentage: number;
  directReferralsNeeded: number;
  color: string;
}

export const LEVEL_COMMISSION_RATES: LevelCommissionRate[] = [
  { level: 1, percentage: 15, directReferralsNeeded: 1, color: 'from-purple-500 to-pink-500' },
  { level: 2, percentage: 12, directReferralsNeeded: 2, color: 'from-blue-500 to-purple-500' },
  { level: 3, percentage: 10, directReferralsNeeded: 3, color: 'from-green-500 to-blue-500' },
  { level: 4, percentage: 8, directReferralsNeeded: 4, color: 'from-yellow-500 to-green-500' },
  { level: 5, percentage: 5, directReferralsNeeded: 5, color: 'from-orange-500 to-yellow-500' },
  { level: 6, percentage: 5, directReferralsNeeded: 5, color: 'from-red-500 to-orange-500' },
  { level: 7, percentage: 5, directReferralsNeeded: 5, color: 'from-pink-500 to-red-500' },
  { level: 8, percentage: 3, directReferralsNeeded: 6, color: 'from-indigo-500 to-purple-500' },
  { level: 9, percentage: 3, directReferralsNeeded: 6, color: 'from-cyan-500 to-blue-500' },
  { level: 10, percentage: 3, directReferralsNeeded: 6, color: 'from-teal-500 to-green-500' },
  { level: 11, percentage: 2, directReferralsNeeded: 7, color: 'from-lime-500 to-green-500' },
  { level: 12, percentage: 2, directReferralsNeeded: 7, color: 'from-amber-500 to-orange-500' },
  { level: 13, percentage: 2, directReferralsNeeded: 7, color: 'from-rose-500 to-pink-500' },
  { level: 14, percentage: 2, directReferralsNeeded: 7, color: 'from-violet-500 to-purple-500' },
  { level: 15, percentage: 2, directReferralsNeeded: 7, color: 'from-sky-500 to-blue-500' },
  { level: 16, percentage: 1, directReferralsNeeded: 8, color: 'from-emerald-500 to-teal-500' },
  { level: 17, percentage: 1, directReferralsNeeded: 8, color: 'from-fuchsia-500 to-pink-500' },
  { level: 18, percentage: 1, directReferralsNeeded: 8, color: 'from-indigo-500 to-blue-500' },
  { level: 19, percentage: 1, directReferralsNeeded: 8, color: 'from-orange-500 to-red-500' },
  { level: 20, percentage: 1, directReferralsNeeded: 8, color: 'from-purple-500 to-fuchsia-500' },
];
