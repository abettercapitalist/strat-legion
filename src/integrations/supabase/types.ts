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
      approval_templates: {
        Row: {
          approval_sequence: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_conditions: Json | null
          updated_at: string
        }
        Insert: {
          approval_sequence?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Update: {
          approval_sequence?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      clause_alternatives: {
        Row: {
          alternative_text: string
          business_impact: string | null
          clause_id: string
          created_at: string
          id: string
          use_case: string | null
        }
        Insert: {
          alternative_text: string
          business_impact?: string | null
          clause_id: string
          created_at?: string
          id?: string
          use_case?: string | null
        }
        Update: {
          alternative_text?: string
          business_impact?: string | null
          clause_id?: string
          created_at?: string
          id?: string
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clause_alternatives_clause_id_fkey"
            columns: ["clause_id"]
            isOneToOne: false
            referencedRelation: "clauses"
            referencedColumns: ["id"]
          },
        ]
      }
      clauses: {
        Row: {
          business_context: string | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_standard: boolean | null
          risk_level: string | null
          text: string
          title: string
          updated_at: string
        }
        Insert: {
          business_context?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_standard?: boolean | null
          risk_level?: string | null
          text: string
          title: string
          updated_at?: string
        }
        Update: {
          business_context?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_standard?: boolean | null
          risk_level?: string | null
          text?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clauses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counterparties: {
        Row: {
          address: string | null
          counterparty_type: string | null
          created_at: string
          entity_type: string | null
          id: string
          name: string
          notes: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          relationship_status: string | null
          state_of_formation: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          counterparty_type?: string | null
          created_at?: string
          entity_type?: string | null
          id?: string
          name: string
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          relationship_status?: string | null
          state_of_formation?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          counterparty_type?: string | null
          created_at?: string
          entity_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          relationship_status?: string | null
          state_of_formation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      template_clauses: {
        Row: {
          alternatives_allowed: boolean | null
          approval_required_from: string | null
          clause_id: string
          created_at: string
          id: string
          is_locked: boolean | null
          position: number
          template_id: string
        }
        Insert: {
          alternatives_allowed?: boolean | null
          approval_required_from?: string | null
          clause_id: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          position: number
          template_id: string
        }
        Update: {
          alternatives_allowed?: boolean | null
          approval_required_from?: string | null
          clause_id?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          position?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_clauses_clause_id_fkey"
            columns: ["clause_id"]
            isOneToOne: false
            referencedRelation: "clauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_clauses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: string | null
          updated_at: string
          version: string | null
          workstream_type_id: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string
          version?: string | null
          workstream_type_id?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
          version?: string | null
          workstream_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_workstream_type_id_fkey"
            columns: ["workstream_type_id"]
            isOneToOne: false
            referencedRelation: "workstream_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workstream_types: {
        Row: {
          created_at: string
          default_workflow: string | null
          description: string | null
          id: string
          name: string
          required_documents: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_workflow?: string | null
          description?: string | null
          id?: string
          name: string
          required_documents?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_workflow?: string | null
          description?: string | null
          id?: string
          name?: string
          required_documents?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      workstreams: {
        Row: {
          actual_close_date: string | null
          annual_value: number | null
          business_objective: string | null
          counterparty_id: string | null
          created_at: string
          expected_close_date: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          stage: string | null
          template_id: string | null
          tier: string | null
          updated_at: string
          workstream_type_id: string | null
        }
        Insert: {
          actual_close_date?: string | null
          annual_value?: number | null
          business_objective?: string | null
          counterparty_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          stage?: string | null
          template_id?: string | null
          tier?: string | null
          updated_at?: string
          workstream_type_id?: string | null
        }
        Update: {
          actual_close_date?: string | null
          annual_value?: number | null
          business_objective?: string | null
          counterparty_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          stage?: string | null
          template_id?: string | null
          tier?: string | null
          updated_at?: string
          workstream_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workstreams_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstreams_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstreams_workstream_type_id_fkey"
            columns: ["workstream_type_id"]
            isOneToOne: false
            referencedRelation: "workstream_types"
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
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "general_counsel"
        | "legal_ops"
        | "contract_counsel"
        | "account_executive"
        | "sales_manager"
        | "finance_reviewer"
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
      app_role: [
        "general_counsel",
        "legal_ops",
        "contract_counsel",
        "account_executive",
        "sales_manager",
        "finance_reviewer",
      ],
    },
  },
} as const
