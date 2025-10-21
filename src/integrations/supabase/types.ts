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
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics: {
        Row: {
          created_at: string | null
          id: string
          losing_trades: number | null
          net_profit: number | null
          total_loss: number | null
          total_profit: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          losing_trades?: number | null
          net_profit?: number | null
          total_loss?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          losing_trades?: number | null
          net_profit?: number | null
          total_loss?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: []
      }
      binary_records: {
        Row: {
          amount: number
          asset: string
          created_at: string | null
          direction: string
          duration: number
          entry_price: number
          exit_price: number | null
          expiry_time: string
          id: string
          profit_loss: number | null
          settled_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          asset: string
          created_at?: string | null
          direction: string
          duration: number
          entry_price: number
          exit_price?: number | null
          expiry_time: string
          id?: string
          profit_loss?: number | null
          settled_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          created_at?: string | null
          direction?: string
          duration?: number
          entry_price?: number
          exit_price?: number | null
          expiry_time?: string
          id?: string
          profit_loss?: number | null
          settled_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "binary_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binary_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      binary_signals: {
        Row: {
          accuracy_rate: number | null
          analysis: string | null
          asset: string
          created_at: string | null
          direction: string
          entry_price: number
          expiry_time: string
          id: string
          is_active: boolean | null
          strength: string
        }
        Insert: {
          accuracy_rate?: number | null
          analysis?: string | null
          asset: string
          created_at?: string | null
          direction: string
          entry_price: number
          expiry_time: string
          id?: string
          is_active?: boolean | null
          strength: string
        }
        Update: {
          accuracy_rate?: number | null
          analysis?: string | null
          asset?: string
          created_at?: string | null
          direction?: string
          entry_price?: number
          expiry_time?: string
          id?: string
          is_active?: boolean | null
          strength?: string
        }
        Relationships: []
      }
      bot_strategies: {
        Row: {
          allocated_amount: number
          created_at: string | null
          description: string | null
          id: string
          name: string
          risk_level: string
          status: string | null
          strategy_type: string
          total_profit: number | null
          total_trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          allocated_amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          risk_level: string
          status?: string | null
          strategy_type: string
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          allocated_amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          risk_level?: string
          status?: string | null
          strategy_type?: string
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_transactions: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string | null
          currency: string | null
          from_address: string | null
          id: string
          network: string | null
          status: string | null
          to_address: string
          tx_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          from_address?: string | null
          id?: string
          network?: string | null
          status?: string | null
          to_address: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          from_address?: string | null
          id?: string
          network?: string | null
          status?: string | null
          to_address?: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deposit_wallets: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          network: string
          qr_code_url: string | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          network?: string
          qr_code_url?: string | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          network?: string
          qr_code_url?: string | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      forex_pairs: {
        Row: {
          ask: number
          base_currency: string
          bid: number
          change_amount: number
          change_percent: number
          created_at: string | null
          current_price: number
          daily_high: number
          daily_low: number
          daily_volume: number
          id: string
          last_updated: string | null
          previous_close: number
          quote_currency: string
          spread: number
          symbol: string
        }
        Insert: {
          ask: number
          base_currency: string
          bid: number
          change_amount?: number
          change_percent?: number
          created_at?: string | null
          current_price: number
          daily_high: number
          daily_low: number
          daily_volume?: number
          id?: string
          last_updated?: string | null
          previous_close: number
          quote_currency: string
          spread?: number
          symbol: string
        }
        Update: {
          ask?: number
          base_currency?: string
          bid?: number
          change_amount?: number
          change_percent?: number
          created_at?: string | null
          current_price?: number
          daily_high?: number
          daily_low?: number
          daily_volume?: number
          id?: string
          last_updated?: string | null
          previous_close?: number
          quote_currency?: string
          spread?: number
          symbol?: string
        }
        Relationships: []
      }
      forex_positions: {
        Row: {
          closed_at: string | null
          closed_price: number | null
          commission: number | null
          created_at: string | null
          current_price: number
          entry_price: number
          id: string
          leverage: number
          margin_used: number
          pair_id: string
          position_type: string
          profit_loss: number | null
          profit_loss_percent: number | null
          signal_id: string | null
          status: string | null
          stop_loss: number | null
          swap_fee: number | null
          take_profit: number | null
          updated_at: string | null
          user_id: string
          volume: number
        }
        Insert: {
          closed_at?: string | null
          closed_price?: number | null
          commission?: number | null
          created_at?: string | null
          current_price: number
          entry_price: number
          id?: string
          leverage?: number
          margin_used: number
          pair_id: string
          position_type: string
          profit_loss?: number | null
          profit_loss_percent?: number | null
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          swap_fee?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id: string
          volume: number
        }
        Update: {
          closed_at?: string | null
          closed_price?: number | null
          commission?: number | null
          created_at?: string | null
          current_price?: number
          entry_price?: number
          id?: string
          leverage?: number
          margin_used?: number
          pair_id?: string
          position_type?: string
          profit_loss?: number | null
          profit_loss_percent?: number | null
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          swap_fee?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "forex_positions_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "forex_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      forex_records: {
        Row: {
          closed_at: string | null
          commission: number | null
          created_at: string | null
          entry_price: number
          exit_price: number | null
          id: string
          leverage: number | null
          lot_size: number
          margin_used: number
          opened_at: string | null
          order_type: string
          pair_symbol: string
          position_type: string
          profit_loss: number | null
          status: string | null
          stop_loss: number | null
          swap: number | null
          take_profit: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          commission?: number | null
          created_at?: string | null
          entry_price: number
          exit_price?: number | null
          id?: string
          leverage?: number | null
          lot_size: number
          margin_used: number
          opened_at?: string | null
          order_type: string
          pair_symbol: string
          position_type: string
          profit_loss?: number | null
          status?: string | null
          stop_loss?: number | null
          swap?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          commission?: number | null
          created_at?: string | null
          entry_price?: number
          exit_price?: number | null
          id?: string
          leverage?: number | null
          lot_size?: number
          margin_used?: number
          opened_at?: string | null
          order_type?: string
          pair_symbol?: string
          position_type?: string
          profit_loss?: number | null
          status?: string | null
          stop_loss?: number | null
          swap?: number | null
          take_profit?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forex_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forex_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forex_signals: {
        Row: {
          accuracy_rate: number | null
          analysis: string | null
          created_at: string | null
          entry_price: number
          expired_at: string | null
          id: string
          is_active: boolean | null
          pair_id: string
          risk_level: string | null
          signal_type: string
          stop_loss: number | null
          strength: string
          take_profit_1: number | null
          take_profit_2: number | null
          take_profit_3: number | null
          timeframe: string | null
        }
        Insert: {
          accuracy_rate?: number | null
          analysis?: string | null
          created_at?: string | null
          entry_price: number
          expired_at?: string | null
          id?: string
          is_active?: boolean | null
          pair_id: string
          risk_level?: string | null
          signal_type: string
          stop_loss?: number | null
          strength: string
          take_profit_1?: number | null
          take_profit_2?: number | null
          take_profit_3?: number | null
          timeframe?: string | null
        }
        Update: {
          accuracy_rate?: number | null
          analysis?: string | null
          created_at?: string | null
          entry_price?: number
          expired_at?: string | null
          id?: string
          is_active?: boolean | null
          pair_id?: string
          risk_level?: string | null
          signal_type?: string
          stop_loss?: number | null
          strength?: string
          take_profit_1?: number | null
          take_profit_2?: number | null
          take_profit_3?: number | null
          timeframe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forex_signals_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "forex_pairs"
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
          max_amount: number
          min_amount: number
          name: string
          status: string | null
          total_return_percent: number
        }
        Insert: {
          created_at?: string | null
          daily_roi: number
          description?: string | null
          duration_days: number
          id?: string
          max_amount: number
          min_amount: number
          name: string
          status?: string | null
          total_return_percent: number
        }
        Update: {
          created_at?: string | null
          daily_roi?: number
          description?: string | null
          duration_days?: number
          id?: string
          max_amount?: number
          min_amount?: number
          name?: string
          status?: string | null
          total_return_percent?: number
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string | null
          daily_roi_amount: number | null
          end_date: string
          id: string
          last_payout_date: string | null
          plan_id: string
          roi_credited_days: number | null
          start_date: string | null
          status: string | null
          total_roi_earned: number | null
          total_roi_expected: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          daily_roi_amount?: number | null
          end_date: string
          id?: string
          last_payout_date?: string | null
          plan_id: string
          roi_credited_days?: number | null
          start_date?: string | null
          status?: string | null
          total_roi_earned?: number | null
          total_roi_expected?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          daily_roi_amount?: number | null
          end_date?: string
          id?: string
          last_payout_date?: string | null
          plan_id?: string
          roi_credited_days?: number | null
          start_date?: string | null
          status?: string | null
          total_roi_earned?: number | null
          total_roi_expected?: number | null
          updated_at?: string | null
          user_id?: string
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
            referencedRelation: "profiles"
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
      market_data: {
        Row: {
          change_percent: number
          created_at: string | null
          id: string
          last_updated: string | null
          market_cap: number | null
          price: number
          symbol: string
          volume: number
        }
        Insert: {
          change_percent?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          market_cap?: number | null
          price: number
          symbol: string
          volume?: number
        }
        Update: {
          change_percent?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          market_cap?: number | null
          price?: number
          symbol?: string
          volume?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          referral_code: string
          referred_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          referral_code: string
          referred_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_bonuses: {
        Row: {
          amount: number
          base_amount: number | null
          bonus_type: string
          created_at: string | null
          from_user_id: string | null
          id: string
          level: number
          percentage: number | null
          referral_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          base_amount?: number | null
          bonus_type: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          level: number
          percentage?: number | null
          referral_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          base_amount?: number | null
          bonus_type?: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          level?: number
          percentage?: number | null
          referral_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_bonuses_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bonuses_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bonuses_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bonuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bonuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          level: number
          referred_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: number
          referred_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number
          referred_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_investments: {
        Row: {
          amount: number
          created_at: string | null
          credited_at: string | null
          description: string | null
          id: string
          investment_id: string
          roi_date: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          credited_at?: string | null
          description?: string | null
          id?: string
          investment_id: string
          roi_date?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          credited_at?: string | null
          description?: string | null
          id?: string
          investment_id?: string
          roi_date?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roi_investments_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roi_investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roi_investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_payments: {
        Row: {
          achievement_tier: string
          amount: number
          created_at: string
          id: string
          paid_at: string
          payment_month: number
          tier_reached_at: string
          user_id: string
        }
        Insert: {
          achievement_tier: string
          amount: number
          created_at?: string
          id?: string
          paid_at?: string
          payment_month: number
          tier_reached_at: string
          user_id: string
        }
        Update: {
          achievement_tier?: string
          amount?: number
          created_at?: string
          id?: string
          paid_at?: string
          payment_month?: number
          tier_reached_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staking_plans: {
        Row: {
          created_at: string | null
          daily_return: number
          description: string | null
          duration_days: number
          id: string
          max_amount: number
          min_amount: number
          name: string
          status: string | null
          total_return_percent: number
        }
        Insert: {
          created_at?: string | null
          daily_return: number
          description?: string | null
          duration_days: number
          id?: string
          max_amount: number
          min_amount: number
          name: string
          status?: string | null
          total_return_percent: number
        }
        Update: {
          created_at?: string | null
          daily_return?: number
          description?: string | null
          duration_days?: number
          id?: string
          max_amount?: number
          min_amount?: number
          name?: string
          status?: string | null
          total_return_percent?: number
        }
        Relationships: []
      }
      staking_records: {
        Row: {
          amount: number
          created_at: string | null
          daily_return_amount: number | null
          days_credited: number | null
          end_date: string
          id: string
          last_payout_date: string | null
          plan_id: string
          start_date: string | null
          status: string | null
          total_earned: number | null
          total_expected: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          daily_return_amount?: number | null
          days_credited?: number | null
          end_date: string
          id?: string
          last_payout_date?: string | null
          plan_id: string
          start_date?: string | null
          status?: string | null
          total_earned?: number | null
          total_expected?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          daily_return_amount?: number | null
          days_credited?: number | null
          end_date?: string
          id?: string
          last_payout_date?: string | null
          plan_id?: string
          start_date?: string | null
          status?: string | null
          total_earned?: number | null
          total_expected?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staking_records_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "staking_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staking_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staking_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_achievements: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          milestone_amount: number
          name: string
          reward_amount: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          milestone_amount: number
          name: string
          reward_amount: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          milestone_amount?: number
          name?: string
          reward_amount?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          category: string | null
          created_at: string | null
          currency: string | null
          id: string
          income_type: string | null
          network: string | null
          notes: string | null
          reason: string | null
          reference_id: string | null
          status: string | null
          to_address: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          income_type?: string | null
          network?: string | null
          notes?: string | null
          reason?: string | null
          reference_id?: string | null
          status?: string | null
          to_address?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          category?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          income_type?: string | null
          network?: string | null
          notes?: string | null
          reason?: string | null
          reference_id?: string | null
          status?: string | null
          to_address?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievement_progress: {
        Row: {
          achievement_id: string
          claimed_at: string | null
          created_at: string | null
          id: string
          is_claimed: boolean | null
          progress: number | null
          tier_reached_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          is_claimed?: boolean | null
          progress?: number | null
          tier_reached_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          is_claimed?: boolean | null
          progress?: number | null
          tier_reached_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievement_progress_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "team_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      wallets: {
        Row: {
          balance: number | null
          bonus_income: number | null
          created_at: string | null
          currency: string | null
          id: string
          last_transaction_at: string | null
          level_income: number | null
          locked_balance: number | null
          network: string | null
          referral_income: number | null
          roi_income: number | null
          total_deposited: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          balance?: number | null
          bonus_income?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          last_transaction_at?: string | null
          level_income?: number | null
          locked_balance?: number | null
          network?: string | null
          referral_income?: number | null
          roi_income?: number | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          balance?: number | null
          bonus_income?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          last_transaction_at?: string | null
          level_income?: number | null
          locked_balance?: number | null
          network?: string | null
          referral_income?: number | null
          roi_income?: number | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string | null
          id: string
          network: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string | null
          id?: string
          network: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          network?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      staking_positions: {
        Row: {
          amount: number | null
          created_at: string | null
          daily_return_amount: number | null
          days_credited: number | null
          end_date: string | null
          id: string | null
          last_payout_date: string | null
          plan_id: string | null
          start_date: string | null
          status: string | null
          total_earned: number | null
          total_expected: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          daily_return_amount?: number | null
          days_credited?: number | null
          end_date?: string | null
          id?: string | null
          last_payout_date?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          total_earned?: number | null
          total_expected?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          daily_return_amount?: number | null
          days_credited?: number | null
          end_date?: string | null
          id?: string | null
          last_payout_date?: string | null
          plan_id?: string | null
          start_date?: string | null
          status?: string | null
          total_earned?: number | null
          total_expected?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staking_records_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "staking_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staking_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staking_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          balance: number | null
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          total_deposited: number | null
          total_investment: number | null
          total_roi_earned: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_withdrawal: {
        Args: { withdrawal_id: string }
        Returns: Json
      }
      build_referral_tree: {
        Args: { new_user_id: string; referrer_id: string }
        Returns: undefined
      }
      calculate_team_deposits: {
        Args: { referrer_user_id: string }
        Returns: number
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_tier_salary_amount: {
        Args: { p_tier: string }
        Returns: number
      }
      get_user_achievement_tier: {
        Args: { p_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_binary_trade: {
        Args: {
          p_amount: number
          p_asset: string
          p_direction: string
          p_duration: number
          p_entry_price: number
        }
        Returns: Json
      }
      reject_withdrawal: {
        Args: { note?: string; withdrawal_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "admin" | "superadmin" | "super-admin"
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
    Enums: {
      app_role: ["user", "admin", "superadmin", "super-admin"],
    },
  },
} as const
