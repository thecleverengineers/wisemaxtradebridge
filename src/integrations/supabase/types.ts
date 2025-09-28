export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          average_loss: number | null
          average_profit: number | null
          best_trade: number | null
          created_at: string
          date: string
          id: string
          max_drawdown: number | null
          profit_loss: number | null
          sharpe_ratio: number | null
          successful_trades: number | null
          total_trades: number | null
          total_volume: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
          worst_trade: number | null
        }
        Insert: {
          average_loss?: number | null
          average_profit?: number | null
          best_trade?: number | null
          created_at?: string
          date: string
          id?: string
          max_drawdown?: number | null
          profit_loss?: number | null
          sharpe_ratio?: number | null
          successful_trades?: number | null
          total_trades?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
          worst_trade?: number | null
        }
        Update: {
          average_loss?: number | null
          average_profit?: number | null
          best_trade?: number | null
          created_at?: string
          date?: string
          id?: string
          max_drawdown?: number | null
          profit_loss?: number | null
          sharpe_ratio?: number | null
          successful_trades?: number | null
          total_trades?: number | null
          total_volume?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
          worst_trade?: number | null
        }
        Relationships: []
      }
      bot_strategies: {
        Row: {
          config: Json
          created_at: string
          current_trades_today: number | null
          id: string
          last_trade_at: string | null
          max_trades_per_day: number | null
          name: string
          status: string
          stop_loss: number | null
          take_profit: number | null
          total_profit: number | null
          total_trades: number | null
          type: string
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          config: Json
          created_at?: string
          current_trades_today?: number | null
          id?: string
          last_trade_at?: string | null
          max_trades_per_day?: number | null
          name: string
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          total_profit?: number | null
          total_trades?: number | null
          type: string
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          config?: Json
          created_at?: string
          current_trades_today?: number | null
          id?: string
          last_trade_at?: string | null
          max_trades_per_day?: number | null
          name?: string
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          total_profit?: number | null
          total_trades?: number | null
          type?: string
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      market_data: {
        Row: {
          change_percent: number | null
          close: number | null
          created_at: string | null
          high: number | null
          id: string
          low: number | null
          open: number | null
          price: number
          symbol: string
          timestamp: string | null
          volume: number | null
        }
        Insert: {
          change_percent?: number | null
          close?: number | null
          created_at?: string | null
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          price: number
          symbol: string
          timestamp?: string | null
          volume?: number | null
        }
        Update: {
          change_percent?: number | null
          close?: number | null
          created_at?: string | null
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          price?: number
          symbol?: string
          timestamp?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          kyc_status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          kyc_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          kyc_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_earned: number | null
          created_at: string
          id: string
          last_activity_at: string | null
          level: number
          referred_id: string
          referrer_id: string
          status: string | null
          total_deposits: number | null
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string
          id?: string
          last_activity_at?: string | null
          level?: number
          referred_id: string
          referrer_id: string
          status?: string | null
          total_deposits?: number | null
        }
        Update: {
          commission_earned?: number | null
          created_at?: string
          id?: string
          last_activity_at?: string | null
          level?: number
          referred_id?: string
          referrer_id?: string
          status?: string | null
          total_deposits?: number | null
        }
        Relationships: []
      }
      roi_investments: {
        Row: {
          amount: number
          created_at: string | null
          daily_return: number
          duration_days: number
          expires_at: string
          id: string
          last_payout_at: string | null
          plan_name: string
          started_at: string | null
          status: string | null
          total_paid_out: number | null
          total_return: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          daily_return: number
          duration_days: number
          expires_at: string
          id?: string
          last_payout_at?: string | null
          plan_name: string
          started_at?: string | null
          status?: string | null
          total_paid_out?: number | null
          total_return: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          daily_return?: number
          duration_days?: number
          expires_at?: string
          id?: string
          last_payout_at?: string | null
          plan_name?: string
          started_at?: string | null
          status?: string | null
          total_paid_out?: number | null
          total_return?: number
          user_id?: string
        }
        Relationships: []
      }
      staking_positions: {
        Row: {
          amount: number
          apy: number
          auto_compound: boolean | null
          created_at: string
          id: string
          last_claim_date: string | null
          locked_until: string | null
          penalty_rate: number | null
          rewards_earned: number | null
          status: string
          token: string
          total_rewards_claimed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          apy: number
          auto_compound?: boolean | null
          created_at?: string
          id?: string
          last_claim_date?: string | null
          locked_until?: string | null
          penalty_rate?: number | null
          rewards_earned?: number | null
          status?: string
          token: string
          total_rewards_claimed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          apy?: number
          auto_compound?: boolean | null
          created_at?: string
          id?: string
          last_claim_date?: string | null
          locked_until?: string | null
          penalty_rate?: number | null
          rewards_earned?: number | null
          status?: string
          token?: string
          total_rewards_claimed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          closed_at: string | null
          commission: number | null
          created_at: string
          entry_price: number | null
          exit_price: number | null
          id: string
          leverage: number | null
          notes: string | null
          pair: string
          price: number
          profit_loss: number | null
          status: string
          stop_loss: number | null
          swap: number | null
          take_profit: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          closed_at?: string | null
          commission?: number | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          leverage?: number | null
          notes?: string | null
          pair: string
          price: number
          profit_loss?: number | null
          status?: string
          stop_loss?: number | null
          swap?: number | null
          take_profit?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          commission?: number | null
          created_at?: string
          entry_price?: number | null
          exit_price?: number | null
          id?: string
          leverage?: number | null
          notes?: string | null
          pair?: string
          price?: number
          profit_loss?: number | null
          status?: string
          stop_loss?: number | null
          swap?: number | null
          take_profit?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string
          fee: number | null
          from_address: string | null
          id: string
          network: string | null
          notes: string | null
          processed_at: string | null
          reference_id: string | null
          status: string | null
          to_address: string | null
          tx_hash: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          currency: string
          fee?: number | null
          from_address?: string | null
          id?: string
          network?: string | null
          notes?: string | null
          processed_at?: string | null
          reference_id?: string | null
          status?: string | null
          to_address?: string | null
          tx_hash?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string
          fee?: number | null
          from_address?: string | null
          id?: string
          network?: string | null
          notes?: string | null
          processed_at?: string | null
          reference_id?: string | null
          status?: string | null
          to_address?: string | null
          tx_hash?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          kyc_status: string | null
          name: string
          parent_id: string | null
          phone: string | null
          referral_code: string | null
          total_investment: number | null
          total_referral_earned: number | null
          total_roi_earned: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_active?: boolean | null
          kyc_status?: string | null
          name: string
          parent_id?: string | null
          phone?: string | null
          referral_code?: string | null
          total_investment?: number | null
          total_referral_earned?: number | null
          total_roi_earned?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          kyc_status?: string | null
          name?: string
          parent_id?: string | null
          phone?: string | null
          referral_code?: string | null
          total_investment?: number | null
          total_referral_earned?: number | null
          total_roi_earned?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          last_transaction_at: string | null
          locked_balance: number
          network: string | null
          total_deposited: number | null
          total_withdrawn: number | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          balance?: number
          created_at?: string
          currency: string
          id?: string
          last_transaction_at?: string | null
          locked_balance?: number
          network?: string | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          last_transaction_at?: string | null
          locked_balance?: number
          network?: string | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          kyc_status: string
          name: string
          parent_id: string
          phone: string
          referral_code: string
          role: string
          total_investment: number
          total_referral_earned: number
          total_roi_earned: number
          updated_at: string
        }[]
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      process_roi_payouts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
