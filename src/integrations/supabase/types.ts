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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key_hash: string
          api_secret_hash: string
          created_at: string | null
          exchange: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          permissions: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_key_hash: string
          api_secret_hash: string
          created_at?: string | null
          exchange: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_hash?: string
          api_secret_hash?: string
          created_at?: string | null
          exchange?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string | null
          description: string | null
          exchange: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          leverage_available: boolean | null
          logo_url: string | null
          maker_fee: number | null
          max_leverage: number | null
          max_trade_amount: number | null
          metadata: Json | null
          min_trade_amount: number | null
          name: string
          symbol: string
          taker_fee: number | null
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          exchange?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          leverage_available?: boolean | null
          logo_url?: string | null
          maker_fee?: number | null
          max_leverage?: number | null
          max_trade_amount?: number | null
          metadata?: Json | null
          min_trade_amount?: number | null
          name: string
          symbol: string
          taker_fee?: number | null
          type: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          exchange?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          leverage_available?: boolean | null
          logo_url?: string | null
          maker_fee?: number | null
          max_leverage?: number | null
          max_trade_amount?: number | null
          metadata?: Json | null
          min_trade_amount?: number | null
          name?: string
          symbol?: string
          taker_fee?: number | null
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trading: {
        Row: {
          allocation_amount: number
          allocation_percentage: number | null
          created_at: string | null
          follower_id: string | null
          id: string
          is_active: boolean | null
          max_trade_size: number | null
          max_trades_per_day: number | null
          metadata: Json | null
          started_at: string | null
          stop_loss_percentage: number | null
          stopped_at: string | null
          strategy_id: string | null
          take_profit_percentage: number | null
          total_copied_trades: number | null
          total_profit_loss: number | null
          trader_id: string | null
          updated_at: string | null
        }
        Insert: {
          allocation_amount: number
          allocation_percentage?: number | null
          created_at?: string | null
          follower_id?: string | null
          id?: string
          is_active?: boolean | null
          max_trade_size?: number | null
          max_trades_per_day?: number | null
          metadata?: Json | null
          started_at?: string | null
          stop_loss_percentage?: number | null
          stopped_at?: string | null
          strategy_id?: string | null
          take_profit_percentage?: number | null
          total_copied_trades?: number | null
          total_profit_loss?: number | null
          trader_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allocation_amount?: number
          allocation_percentage?: number | null
          created_at?: string | null
          follower_id?: string | null
          id?: string
          is_active?: boolean | null
          max_trade_size?: number | null
          max_trades_per_day?: number | null
          metadata?: Json | null
          started_at?: string | null
          stop_loss_percentage?: number | null
          stopped_at?: string | null
          strategy_id?: string | null
          take_profit_percentage?: number | null
          total_copied_trades?: number | null
          total_profit_loss?: number | null
          trader_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copy_trading_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_trading_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copy_trading_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_plans: {
        Row: {
          created_at: string
          daily_roi: number | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          max_amount: number | null
          min_amount: number
          name: string
          roi_percentage: number
          sort_order: number | null
          total_return_percent: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_roi?: number | null
          description?: string | null
          duration_days: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount: number
          name: string
          roi_percentage: number
          sort_order?: number | null
          total_return_percent?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_roi?: number | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          min_amount?: number
          name?: string
          roi_percentage?: number
          sort_order?: number | null
          total_return_percent?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          daily_roi_amount: number | null
          end_date: string | null
          id: string
          plan_id: string | null
          returns: number | null
          roi_credited_days: number | null
          start_date: string
          status: string | null
          total_roi_expected: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          daily_roi_amount?: number | null
          end_date?: string | null
          id?: string
          plan_id?: string | null
          returns?: number | null
          roi_credited_days?: number | null
          start_date?: string
          status?: string | null
          total_roi_expected?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          daily_roi_amount?: number | null
          end_date?: string | null
          id?: string
          plan_id?: string | null
          returns?: number | null
          roi_credited_days?: number | null
          start_date?: string
          status?: string | null
          total_roi_expected?: number | null
          updated_at?: string
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
        ]
      }
      market_data: {
        Row: {
          ask: number | null
          asset_id: string | null
          bid: number | null
          change_24h: number | null
          change_24h_percent: number | null
          created_at: string | null
          high_24h: number | null
          id: string
          low_24h: number | null
          market_cap: number | null
          price: number
          source: string | null
          timestamp: string | null
          volume_24h: number | null
        }
        Insert: {
          ask?: number | null
          asset_id?: string | null
          bid?: number | null
          change_24h?: number | null
          change_24h_percent?: number | null
          created_at?: string | null
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          price: number
          source?: string | null
          timestamp?: string | null
          volume_24h?: number | null
        }
        Update: {
          ask?: number | null
          asset_id?: string | null
          bid?: number | null
          change_24h?: number | null
          change_24h_percent?: number | null
          created_at?: string | null
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          price?: number
          source?: string | null
          timestamp?: string | null
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_data_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      mt4_accounts: {
        Row: {
          account_number: string
          balance: number | null
          created_at: string | null
          equity: number | null
          free_margin: number | null
          id: string
          investor_password_hash: string | null
          is_active: boolean | null
          last_sync_at: string | null
          margin: number | null
          metadata: Json | null
          password_hash: string
          server: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number: string
          balance?: number | null
          created_at?: string | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          investor_password_hash?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          margin?: number | null
          metadata?: Json | null
          password_hash: string
          server: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string
          balance?: number | null
          created_at?: string | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          investor_password_hash?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          margin?: number | null
          metadata?: Json | null
          password_hash?: string
          server?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt4_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
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
      orders: {
        Row: {
          asset_id: string | null
          average_fill_price: number | null
          cancelled_at: string | null
          created_at: string | null
          executed_at: string | null
          filled_quantity: number | null
          id: string
          is_demo: boolean | null
          metadata: Json | null
          price: number | null
          quantity: number
          side: Database["public"]["Enums"]["trade_direction"]
          status: Database["public"]["Enums"]["order_status"] | null
          stop_price: number | null
          time_in_force: string | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          asset_id?: string | null
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          executed_at?: string | null
          filled_quantity?: number | null
          id?: string
          is_demo?: boolean | null
          metadata?: Json | null
          price?: number | null
          quantity: number
          side: Database["public"]["Enums"]["trade_direction"]
          status?: Database["public"]["Enums"]["order_status"] | null
          stop_price?: number | null
          time_in_force?: string | null
          type: Database["public"]["Enums"]["order_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          asset_id?: string | null
          average_fill_price?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          executed_at?: string | null
          filled_quantity?: number | null
          id?: string
          is_demo?: boolean | null
          metadata?: Json | null
          price?: number | null
          quantity?: number
          side?: Database["public"]["Enums"]["trade_direction"]
          status?: Database["public"]["Enums"]["order_status"] | null
          stop_price?: number | null
          time_in_force?: string | null
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_allocations: {
        Row: {
          asset_id: string | null
          created_at: string | null
          current_percentage: number | null
          current_value: number | null
          id: string
          is_active: boolean | null
          profile_id: string | null
          target_percentage: number
          updated_at: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string | null
          current_percentage?: number | null
          current_value?: number | null
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          target_percentage: number
          updated_at?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          current_percentage?: number | null
          current_value?: number | null
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          target_percentage?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_allocations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_allocations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "robo_advisor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          asset_id: string | null
          closed_at: string | null
          created_at: string | null
          current_price: number | null
          entry_price: number
          id: string
          is_demo: boolean | null
          is_open: boolean | null
          leverage: number | null
          liquidation_price: number | null
          margin: number
          metadata: Json | null
          opened_at: string | null
          quantity: number
          realized_pnl: number | null
          side: Database["public"]["Enums"]["trade_direction"]
          stop_loss: number | null
          take_profit: number | null
          unrealized_pnl: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          asset_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price: number
          id?: string
          is_demo?: boolean | null
          is_open?: boolean | null
          leverage?: number | null
          liquidation_price?: number | null
          margin: number
          metadata?: Json | null
          opened_at?: string | null
          quantity: number
          realized_pnl?: number | null
          side: Database["public"]["Enums"]["trade_direction"]
          stop_loss?: number | null
          take_profit?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          asset_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number
          id?: string
          is_demo?: boolean | null
          is_open?: boolean | null
          leverage?: number | null
          liquidation_price?: number | null
          margin?: number
          metadata?: Json | null
          opened_at?: string | null
          quantity?: number
          realized_pnl?: number | null
          side?: Database["public"]["Enums"]["trade_direction"]
          stop_loss?: number | null
          take_profit?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_amount: number | null
          bonus_paid: boolean | null
          created_at: string
          id: string
          referred_id: string | null
          referrer_id: string | null
          status: string | null
        }
        Insert: {
          bonus_amount?: number | null
          bonus_paid?: boolean | null
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Update: {
          bonus_amount?: number | null
          bonus_paid?: boolean | null
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      robo_advisor_profiles: {
        Row: {
          created_at: string | null
          id: string
          investment_goal: string | null
          investment_horizon: number | null
          is_active: boolean | null
          last_rebalance_at: string | null
          max_drawdown: number | null
          metadata: Json | null
          monthly_investment: number | null
          rebalance_frequency: number | null
          risk_score: number | null
          target_return: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          investment_goal?: string | null
          investment_horizon?: number | null
          is_active?: boolean | null
          last_rebalance_at?: string | null
          max_drawdown?: number | null
          metadata?: Json | null
          monthly_investment?: number | null
          rebalance_frequency?: number | null
          risk_score?: number | null
          target_return?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          investment_goal?: string | null
          investment_horizon?: number | null
          is_active?: boolean | null
          last_rebalance_at?: string | null
          max_drawdown?: number | null
          metadata?: Json | null
          monthly_investment?: number | null
          rebalance_frequency?: number | null
          risk_score?: number | null
          target_return?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "robo_advisor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_ledger: {
        Row: {
          amount: number
          created_at: string
          credited_date: string
          id: string
          investment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          credited_date: string
          id?: string
          investment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          credited_date?: string
          id?: string
          investment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_ledger_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          category: string | null
          created_at: string
          data_type: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          data_type?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string | null
          created_at?: string
          data_type?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          asset_id: string | null
          confidence: number | null
          created_at: string | null
          direction: Database["public"]["Enums"]["trade_direction"] | null
          entry_price: number | null
          expires_at: string | null
          id: string
          metadata: Json | null
          signal_type: string
          stop_loss: number | null
          strategy_id: string | null
          strength: number | null
          take_profit: number | null
          timeframe: string | null
        }
        Insert: {
          asset_id?: string | null
          confidence?: number | null
          created_at?: string | null
          direction?: Database["public"]["Enums"]["trade_direction"] | null
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          signal_type: string
          stop_loss?: number | null
          strategy_id?: string | null
          strength?: number | null
          take_profit?: number | null
          timeframe?: string | null
        }
        Update: {
          asset_id?: string | null
          confidence?: number | null
          created_at?: string | null
          direction?: Database["public"]["Enums"]["trade_direction"] | null
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          signal_type?: string
          stop_loss?: number | null
          strategy_id?: string | null
          strength?: number | null
          take_profit?: number | null
          timeframe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          created_at: string | null
          creator_id: string | null
          description: string | null
          expected_return: number | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_drawdown: number | null
          metadata: Json | null
          name: string
          parameters: Json | null
          risk_level: Database["public"]["Enums"]["risk_profile"] | null
          sharpe_ratio: number | null
          subscribers_count: number | null
          total_pnl: number | null
          type: string
          updated_at: string | null
          win_rate: number | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          expected_return?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_drawdown?: number | null
          metadata?: Json | null
          name: string
          parameters?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_profile"] | null
          sharpe_ratio?: number | null
          subscribers_count?: number | null
          total_pnl?: number | null
          type: string
          updated_at?: string | null
          win_rate?: number | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          expected_return?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_drawdown?: number | null
          metadata?: Json | null
          name?: string
          parameters?: Json | null
          risk_level?: Database["public"]["Enums"]["risk_profile"] | null
          sharpe_ratio?: number | null
          subscribers_count?: number | null
          total_pnl?: number | null
          type?: string
          updated_at?: string | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strategies_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          asset_id: string | null
          closed_at: string | null
          created_at: string | null
          direction: Database["public"]["Enums"]["trade_direction"]
          duration: number
          entry_price: number
          exit_price: number | null
          expires_at: string | null
          id: string
          is_demo: boolean | null
          metadata: Json | null
          opened_at: string | null
          payout_rate: number | null
          profit_loss: number | null
          status: Database["public"]["Enums"]["trade_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          asset_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          direction: Database["public"]["Enums"]["trade_direction"]
          duration: number
          entry_price: number
          exit_price?: number | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          metadata?: Json | null
          opened_at?: string | null
          payout_rate?: number | null
          profit_loss?: number | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          asset_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          direction?: Database["public"]["Enums"]["trade_direction"]
          duration?: number
          entry_price?: number
          exit_price?: number | null
          expires_at?: string | null
          id?: string
          is_demo?: boolean | null
          metadata?: Json | null
          opened_at?: string | null
          payout_rate?: number | null
          profit_loss?: number | null
          status?: Database["public"]["Enums"]["trade_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_demo_account: boolean | null
          is_verified: boolean | null
          kyc_documents: Json | null
          kyc_status: string | null
          last_login_at: string | null
          login_count: number | null
          name: string | null
          nationality: string | null
          phone: string | null
          preferred_language: string | null
          profit_loss: number | null
          referral_code: string | null
          risk_profile: Database["public"]["Enums"]["risk_profile"] | null
          state: string | null
          timezone: string | null
          total_investment: number | null
          total_referral_earned: number | null
          total_roi_earned: number | null
          total_trades: number | null
          total_volume: number | null
          trading_experience: number | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string | null
          username: string | null
          win_rate: number | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_demo_account?: boolean | null
          is_verified?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          preferred_language?: string | null
          profit_loss?: number | null
          referral_code?: string | null
          risk_profile?: Database["public"]["Enums"]["risk_profile"] | null
          state?: string | null
          timezone?: string | null
          total_investment?: number | null
          total_referral_earned?: number | null
          total_roi_earned?: number | null
          total_trades?: number | null
          total_volume?: number | null
          trading_experience?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          win_rate?: number | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_demo_account?: boolean | null
          is_verified?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          last_login_at?: string | null
          login_count?: number | null
          name?: string | null
          nationality?: string | null
          phone?: string | null
          preferred_language?: string | null
          profit_loss?: number | null
          referral_code?: string | null
          risk_profile?: Database["public"]["Enums"]["risk_profile"] | null
          state?: string | null
          timezone?: string | null
          total_investment?: number | null
          total_referral_earned?: number | null
          total_roi_earned?: number | null
          total_trades?: number | null
          total_volume?: number | null
          trading_experience?: number | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      wallet_transactions_enhanced: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          currency: string | null
          fee: number | null
          id: string
          metadata: Json | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          id?: string
          metadata?: Json | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          currency?: string | null
          fee?: number | null
          id?: string
          metadata?: Json | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_enhanced_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_enhanced_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          created_at: string
          crypto_balances: Json | null
          currency: string | null
          demo_balance: number | null
          id: string
          locked_balance: number | null
          total_balance: number | null
          total_deposits: number | null
          total_withdrawals: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          crypto_balances?: Json | null
          currency?: string | null
          demo_balance?: number | null
          id?: string
          locked_balance?: number | null
          total_balance?: number | null
          total_deposits?: number | null
          total_withdrawals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          crypto_balances?: Json | null
          currency?: string | null
          demo_balance?: number | null
          id?: string
          locked_balance?: number | null
          total_balance?: number | null
          total_deposits?: number | null
          total_withdrawals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          alerts: Json | null
          asset_id: string | null
          created_at: string | null
          id: string
          sort_order: number | null
          watchlist_id: string | null
        }
        Insert: {
          alerts?: Json | null
          asset_id?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          watchlist_id?: string | null
        }
        Update: {
          alerts?: Json | null
          asset_id?: string | null
          created_at?: string | null
          id?: string
          sort_order?: number | null
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey"
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
          created_at: string
          fee_amount: number | null
          id: string
          net_amount: number
          payment_method: string | null
          processed_at: string | null
          requested_at: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          created_at?: string
          fee_amount?: number | null
          id?: string
          net_amount: number
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          created_at?: string
          fee_amount?: number | null
          id?: string
          net_amount?: number
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_type: "crypto" | "forex" | "stock" | "commodity" | "index"
      kyc_status: "pending" | "in_review" | "approved" | "rejected"
      order_status: "pending" | "filled" | "partial" | "cancelled" | "rejected"
      order_type: "market" | "limit" | "stop" | "stop_limit" | "oco"
      risk_profile:
        | "conservative"
        | "moderate"
        | "balanced"
        | "growth"
        | "aggressive"
      trade_direction: "call" | "put" | "buy" | "sell"
      trade_status: "pending" | "open" | "closed" | "cancelled" | "expired"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "trade"
        | "fee"
        | "bonus"
        | "transfer"
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
      asset_type: ["crypto", "forex", "stock", "commodity", "index"],
      kyc_status: ["pending", "in_review", "approved", "rejected"],
      order_status: ["pending", "filled", "partial", "cancelled", "rejected"],
      order_type: ["market", "limit", "stop", "stop_limit", "oco"],
      risk_profile: [
        "conservative",
        "moderate",
        "balanced",
        "growth",
        "aggressive",
      ],
      trade_direction: ["call", "put", "buy", "sell"],
      trade_status: ["pending", "open", "closed", "cancelled", "expired"],
      transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      transaction_type: [
        "deposit",
        "withdrawal",
        "trade",
        "fee",
        "bonus",
        "transfer",
      ],
    },
  },
} as const
