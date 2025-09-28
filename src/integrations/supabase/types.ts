export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auto_trading_rules: {
        Row: {
          action_amount: number | null
          action_type: string | null
          asset_symbol: string | null
          condition_type: string | null
          condition_value: number | null
          created_at: string | null
          executions_count: number | null
          id: string
          is_active: boolean | null
          last_executed: string | null
          rule_name: string
          user_id: string | null
        }
        Insert: {
          action_amount?: number | null
          action_type?: string | null
          asset_symbol?: string | null
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string | null
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          rule_name: string
          user_id?: string | null
        }
        Update: {
          action_amount?: number | null
          action_type?: string | null
          asset_symbol?: string | null
          condition_type?: string | null
          condition_value?: number | null
          created_at?: string | null
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          rule_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_trading_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trades: {
        Row: {
          allocation_amount: number
          allocation_percentage: number | null
          created_at: string | null
          follower_id: string | null
          id: string
          is_active: boolean | null
          total_copied_trades: number | null
          total_pnl: number | null
          trader_id: string | null
        }
        Insert: {
          allocation_amount: number
          allocation_percentage?: number | null
          created_at?: string | null
          follower_id?: string | null
          id?: string
          is_active?: boolean | null
          total_copied_trades?: number | null
          total_pnl?: number | null
          trader_id?: string | null
        }
        Update: {
          allocation_amount?: number
          allocation_percentage?: number | null
          created_at?: string | null
          follower_id?: string | null
          id?: string
          is_active?: boolean | null
          total_copied_trades?: number | null
          total_pnl?: number | null
          trader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copy_trades_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_trades_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_plans: {
        Row: {
          created_at: string | null
          daily_roi: number
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number
          name: string
          sort_order: number | null
          total_return_percent: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_roi: number
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount: number
          name: string
          sort_order?: number | null
          total_return_percent?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_roi?: number
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          name?: string
          sort_order?: number | null
          total_return_percent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string | null
          daily_roi_amount: number
          end_date: string
          id: string
          last_roi_date: string | null
          plan_id: string | null
          roi_credited_days: number | null
          start_date: string
          status: Database["public"]["Enums"]["investment_status"] | null
          total_roi_expected: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          daily_roi_amount: number
          end_date: string
          id?: string
          last_roi_date?: string | null
          plan_id?: string | null
          roi_credited_days?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["investment_status"] | null
          total_roi_expected: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          daily_roi_amount?: number
          end_date?: string
          id?: string
          last_roi_date?: string | null
          plan_id?: string | null
          roi_credited_days?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["investment_status"] | null
          total_roi_expected?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "investment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sentiment: {
        Row: {
          asset_symbol: string | null
          created_at: string | null
          fear_greed_index: number | null
          id: string
          news_sentiment: number | null
          sentiment_score: number | null
          social_sentiment: number | null
          volume_sentiment: number | null
        }
        Insert: {
          asset_symbol?: string | null
          created_at?: string | null
          fear_greed_index?: number | null
          id?: string
          news_sentiment?: number | null
          sentiment_score?: number | null
          social_sentiment?: number | null
          volume_sentiment?: number | null
        }
        Update: {
          asset_symbol?: string | null
          created_at?: string | null
          fear_greed_index?: number | null
          id?: string
          news_sentiment?: number | null
          sentiment_score?: number | null
          social_sentiment?: number | null
          volume_sentiment?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_analytics: {
        Row: {
          alpha: number | null
          beta: number | null
          calculated_at: string | null
          daily_pnl: number | null
          id: string
          max_drawdown: number | null
          sharpe_ratio: number | null
          total_pnl: number | null
          total_value: number | null
          user_id: string | null
          volatility: number | null
        }
        Insert: {
          alpha?: number | null
          beta?: number | null
          calculated_at?: string | null
          daily_pnl?: number | null
          id?: string
          max_drawdown?: number | null
          sharpe_ratio?: number | null
          total_pnl?: number | null
          total_value?: number | null
          user_id?: string | null
          volatility?: number | null
        }
        Update: {
          alpha?: number | null
          beta?: number | null
          calculated_at?: string | null
          daily_pnl?: number | null
          id?: string
          max_drawdown?: number | null
          sharpe_ratio?: number | null
          total_pnl?: number | null
          total_value?: number | null
          user_id?: string | null
          volatility?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_bonus: {
        Row: {
          amount: number
          base_amount: number
          bonus_type: string
          created_at: string | null
          from_user_id: string | null
          id: string
          investment_id: string | null
          level: number
          percentage: number
          user_id: string | null
        }
        Insert: {
          amount: number
          base_amount: number
          bonus_type: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          investment_id?: string | null
          level: number
          percentage: number
          user_id?: string | null
        }
        Update: {
          amount?: number
          base_amount?: number
          bonus_type?: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          investment_id?: string | null
          level?: number
          percentage?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_bonus_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bonus_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bonus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_profiles: {
        Row: {
          auto_stop_loss: boolean | null
          black_swan_protection: boolean | null
          created_at: string | null
          id: string
          max_daily_loss: number | null
          max_position_size: number | null
          risk_tolerance: string | null
          updated_at: string | null
          user_id: string | null
          var_limit: number | null
        }
        Insert: {
          auto_stop_loss?: boolean | null
          black_swan_protection?: boolean | null
          created_at?: string | null
          id?: string
          max_daily_loss?: number | null
          max_position_size?: number | null
          risk_tolerance?: string | null
          updated_at?: string | null
          user_id?: string | null
          var_limit?: number | null
        }
        Update: {
          auto_stop_loss?: boolean | null
          black_swan_protection?: boolean | null
          created_at?: string | null
          id?: string
          max_daily_loss?: number | null
          max_position_size?: number | null
          risk_tolerance?: string | null
          updated_at?: string | null
          user_id?: string | null
          var_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_ledger: {
        Row: {
          amount: number
          credited_at: string | null
          id: string
          investment_id: string | null
          roi_date: string
          user_id: string | null
        }
        Insert: {
          amount: number
          credited_at?: string | null
          id?: string
          investment_id?: string | null
          roi_date?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          credited_at?: string | null
          id?: string
          investment_id?: string | null
          roi_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_ledger_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roi_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          category: string | null
          data_type: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          category?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          category?: string | null
          data_type?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      social_traders: {
        Row: {
          bio: string | null
          copy_trading_enabled: boolean | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          min_copy_amount: number | null
          risk_score: number | null
          total_followers: number | null
          total_return_percentage: number | null
          trader_name: string | null
          user_id: string | null
          win_rate: number | null
        }
        Insert: {
          bio?: string | null
          copy_trading_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          min_copy_amount?: number | null
          risk_score?: number | null
          total_followers?: number | null
          total_return_percentage?: number | null
          trader_name?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Update: {
          bio?: string | null
          copy_trading_enabled?: boolean | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          min_copy_amount?: number | null
          risk_score?: number | null
          total_followers?: number | null
          total_return_percentage?: number | null
          trader_name?: string | null
          user_id?: string | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_traders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          kyc_documents: Json | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
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
          id: string
          is_active?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
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
          id?: string
          is_active?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          id: string
          income_type: Database["public"]["Enums"]["income_type"]
          reason: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          id?: string
          income_type: Database["public"]["Enums"]["income_type"]
          reason?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          id?: string
          income_type?: Database["public"]["Enums"]["income_type"]
          reason?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          bonus_income: number | null
          created_at: string | null
          id: string
          level_income: number | null
          referral_income: number | null
          roi_income: number | null
          total_balance: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bonus_income?: number | null
          created_at?: string | null
          id?: string
          level_income?: number | null
          referral_income?: number | null
          roi_income?: number | null
          total_balance?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bonus_income?: number | null
          created_at?: string | null
          id?: string
          level_income?: number | null
          referral_income?: number | null
          roi_income?: number | null
          total_balance?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      web3_wallets: {
        Row: {
          chain_id: number | null
          created_at: string | null
          defi_protocols: Json | null
          id: string
          is_primary: boolean | null
          last_synced: string | null
          nft_count: number | null
          user_id: string | null
          wallet_address: string
          wallet_type: string | null
        }
        Insert: {
          chain_id?: number | null
          created_at?: string | null
          defi_protocols?: Json | null
          id?: string
          is_primary?: boolean | null
          last_synced?: string | null
          nft_count?: number | null
          user_id?: string | null
          wallet_address: string
          wallet_type?: string | null
        }
        Update: {
          chain_id?: number | null
          created_at?: string | null
          defi_protocols?: Json | null
          id?: string
          is_primary?: boolean | null
          last_synced?: string | null
          nft_count?: number | null
          user_id?: string | null
          wallet_address?: string
          wallet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web3_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_details: Json | null
          fee_amount: number | null
          id: string
          net_amount: number
          processed_at: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["withdrawal_status"] | null
          upi_id: string | null
          user_id: string | null
          withdrawal_method: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          fee_amount?: number | null
          id?: string
          net_amount: number
          processed_at?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          upi_id?: string | null
          user_id?: string | null
          withdrawal_method: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          fee_amount?: number | null
          id?: string
          net_amount?: number
          processed_at?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          upi_id?: string | null
          user_id?: string | null
          withdrawal_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      income_type: "roi" | "referral" | "level" | "bonus" | "manual"
      investment_status: "active" | "completed" | "cancelled"
      kyc_status: "pending" | "approved" | "rejected"
      transaction_type: "credit" | "debit"
      user_role: "user" | "admin" | "super_admin"
      withdrawal_status: "pending" | "approved" | "rejected" | "processed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      income_type: ["roi", "referral", "level", "bonus", "manual"],
      investment_status: ["active", "completed", "cancelled"],
      kyc_status: ["pending", "approved", "rejected"],
      transaction_type: ["credit", "debit"],
      user_role: ["user", "admin", "super_admin"],
      withdrawal_status: ["pending", "approved", "rejected", "processed"],
    },
  },
} as const
