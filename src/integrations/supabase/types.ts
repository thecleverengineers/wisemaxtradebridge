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
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          kyc_documents: Json | null
          kyc_status: string | null
          name: string | null
          phone: string | null
          referral_code: string | null
          state: string | null
          total_investment: number | null
          total_referral_earned: number | null
          total_roi_earned: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          state?: string | null
          total_investment?: number | null
          total_referral_earned?: number | null
          total_roi_earned?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          kyc_documents?: Json | null
          kyc_status?: string | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          state?: string | null
          total_investment?: number | null
          total_referral_earned?: number | null
          total_roi_earned?: number | null
          updated_at?: string
          user_id?: string | null
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
      wallets: {
        Row: {
          created_at: string
          id: string
          total_balance: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          total_balance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          total_balance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
