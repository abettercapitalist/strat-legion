Initialising login role...
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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      approval_decisions: {
        Row: {
          approval_id: string
          created_at: string
          decided_by: string | null
          decision: string
          decision_factors: Json | null
          id: string
          reasoning: string | null
        }
        Insert: {
          approval_id: string
          created_at?: string
          decided_by?: string | null
          decision: string
          decision_factors?: Json | null
          id?: string
          reasoning?: string | null
        }
        Update: {
          approval_id?: string
          created_at?: string
          decided_by?: string | null
          decision?: string
          decision_factors?: Json | null
          id?: string
          reasoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_decisions_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "workstream_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_templates: {
        Row: {
          approval_sequence: Json
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          status: string | null
          trigger_conditions: Json | null
          updated_at: string
        }
        Insert: {
          approval_sequence?: Json
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          status?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Update: {
          approval_sequence?: Json
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          status?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brick_categories: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          display_order: number
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          display_order: number
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bricks: {
        Row: {
          brick_number: number
          category_id: string
          created_at: string
          dependencies: string[] | null
          dependency_level: string
          display_name: string
          id: string
          input_schema: Json
          is_active: boolean
          is_container: boolean
          name: string
          output_schema: Json
          purpose: string
          updated_at: string
        }
        Insert: {
          brick_number: number
          category_id: string
          created_at?: string
          dependencies?: string[] | null
          dependency_level: string
          display_name: string
          id?: string
          input_schema?: Json
          is_active?: boolean
          is_container?: boolean
          name: string
          output_schema?: Json
          purpose: string
          updated_at?: string
        }
        Update: {
          brick_number?: number
          category_id?: string
          created_at?: string
          dependencies?: string[] | null
          dependency_level?: string
          display_name?: string
          id?: string
          input_schema?: Json
          is_active?: boolean
          is_container?: boolean
          name?: string
          output_schema?: Json
          purpose?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bricks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "brick_categories"
            referencedColumns: ["id"]
          },
        ]
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
      content_tags: {
        Row: {
          confidence: number | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          tag_id: string
          tagged_by: string | null
        }
        Insert: {
          confidence?: number | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          tag_id: string
          tagged_by?: string | null
        }
        Update: {
          confidence?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          tag_id?: string
          tagged_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tags_tagged_by_fkey"
            columns: ["tagged_by"]
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
      decision_outcomes: {
        Row: {
          approval_decision_id: string
          created_at: string
          id: string
          outcome: string
          outcome_notes: string | null
          outcome_time: string | null
          workstream_id: string
        }
        Insert: {
          approval_decision_id: string
          created_at?: string
          id?: string
          outcome: string
          outcome_notes?: string | null
          outcome_time?: string | null
          workstream_id: string
        }
        Update: {
          approval_decision_id?: string
          created_at?: string
          id?: string
          outcome?: string
          outcome_notes?: string | null
          outcome_time?: string | null
          workstream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_outcomes_approval_decision_id_fkey"
            columns: ["approval_decision_id"]
            isOneToOne: false
            referencedRelation: "approval_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_outcomes_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      libraries: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          library_type: string
          owner_id: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          library_type: string
          owner_id?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          library_type?: string
          owner_id?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_artifacts: {
        Row: {
          id: string
          library_id: string
          name: string
          display_name: string
          artifact_type: string
          content: Json
          file_url: string | null
          version: number
          is_active: boolean
          tags: string[]
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          library_id: string
          name: string
          display_name: string
          artifact_type: string
          content?: Json
          file_url?: string | null
          version?: number
          is_active?: boolean
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          library_id?: string
          name?: string
          display_name?: string
          artifact_type?: string
          content?: Json
          file_url?: string | null
          version?: number
          is_active?: boolean
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_artifacts_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      library_templates: {
        Row: {
          id: string
          library_id: string
          name: string
          display_name: string
          description: string | null
          template_type: string
          content: Json
          parameters: Json
          version: number
          is_active: boolean
          tags: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          library_id: string
          name: string
          display_name: string
          description?: string | null
          template_type: string
          content?: Json
          parameters?: Json
          version?: number
          is_active?: boolean
          tags?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          library_id?: string
          name?: string
          display_name?: string
          description?: string | null
          template_type?: string
          content?: Json
          parameters?: Json
          version?: number
          is_active?: boolean
          tags?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_templates_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      node_execution_state: {
        Row: {
          id: string
          workstream_id: string
          play_id: string
          node_id: string
          status: string
          inputs: Json
          outputs: Json
          error: string | null
          started_at: string | null
          completed_at: string | null
          executed_by: string | null
          retry_count: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workstream_id: string
          play_id: string
          node_id: string
          status?: string
          inputs?: Json
          outputs?: Json
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          executed_by?: string | null
          retry_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workstream_id?: string
          play_id?: string
          node_id?: string
          status?: string
          inputs?: Json
          outputs?: Json
          error?: string | null
          started_at?: string | null
          completed_at?: string | null
          executed_by?: string | null
          retry_count?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_execution_state_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "playbook_plays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_execution_state_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      needs: {
        Row: {
          created_at: string
          description: string
          due_at: string | null
          id: string
          need_type: string
          required_before: string | null
          satisfaction_reference_id: string | null
          satisfaction_reference_type: string | null
          satisfied_at: string | null
          satisfied_by: string | null
          satisfier_role: string | null
          satisfier_type: string | null
          source_id: string | null
          source_reason: string | null
          source_type: string
          status: string
          updated_at: string
          workstream_id: string
        }
        Insert: {
          created_at?: string
          description: string
          due_at?: string | null
          id?: string
          need_type: string
          required_before?: string | null
          satisfaction_reference_id?: string | null
          satisfaction_reference_type?: string | null
          satisfied_at?: string | null
          satisfied_by?: string | null
          satisfier_role?: string | null
          satisfier_type?: string | null
          source_id?: string | null
          source_reason?: string | null
          source_type: string
          status?: string
          updated_at?: string
          workstream_id: string
        }
        Update: {
          created_at?: string
          description?: string
          due_at?: string | null
          id?: string
          need_type?: string
          required_before?: string | null
          satisfaction_reference_id?: string | null
          satisfaction_reference_type?: string | null
          satisfied_at?: string | null
          satisfied_by?: string | null
          satisfier_role?: string | null
          satisfier_type?: string | null
          source_id?: string | null
          source_reason?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          workstream_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          module: string | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id: string
          module?: string | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          name?: string
        }
        Relationships: []
      }
      playbook_patterns: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          pattern_type: string
          playbook_id: string
          position: number
          trigger_conditions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          pattern_type: string
          playbook_id: string
          position?: number
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          pattern_type?: string
          playbook_id?: string
          position?: number
          trigger_conditions?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_patterns_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_plays: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          display_name: string
          estimated_duration_minutes: number | null
          execution_conditions: Json | null
          id: string
          input_mapping: Json | null
          is_active: boolean
          metadata: Json | null
          name: string
          output_mapping: Json | null
          pattern_id: string | null
          playbook_id: string | null
          position: number
          sla_hours: number | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          display_name: string
          estimated_duration_minutes?: number | null
          execution_conditions?: Json | null
          id?: string
          input_mapping?: Json | null
          is_active?: boolean
          metadata?: Json | null
          name: string
          output_mapping?: Json | null
          pattern_id?: string | null
          playbook_id?: string | null
          position?: number
          sla_hours?: number | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          estimated_duration_minutes?: number | null
          execution_conditions?: Json | null
          id?: string
          input_mapping?: Json | null
          is_active?: boolean
          metadata?: Json | null
          name?: string
          output_mapping?: Json | null
          pattern_id?: string | null
          playbook_id?: string | null
          position?: number
          sla_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_plays_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "playbook_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_plays_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          is_template: boolean
          metadata: Json | null
          name: string
          updated_at: string
          version: number
          workstream_type_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          is_template?: boolean
          metadata?: Json | null
          name: string
          updated_at?: string
          version?: number
          workstream_type_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_template?: boolean
          metadata?: Json | null
          name?: string
          updated_at?: string
          version?: number
          workstream_type_id?: string | null
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
      response_library: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          response_text: string
          success_rate: number | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          response_text: string
          success_rate?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          response_text?: string
          success_rate?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "response_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      response_usage: {
        Row: {
          context_notes: string | null
          created_at: string
          customer_question: string | null
          customer_reaction: string | null
          effectiveness_rating: number | null
          id: string
          response_library_id: string
          response_sent: string | null
          used_by: string | null
          workstream_id: string
        }
        Insert: {
          context_notes?: string | null
          created_at?: string
          customer_question?: string | null
          customer_reaction?: string | null
          effectiveness_rating?: number | null
          id?: string
          response_library_id: string
          response_sent?: string | null
          used_by?: string | null
          workstream_id: string
        }
        Update: {
          context_notes?: string | null
          created_at?: string
          customer_question?: string | null
          customer_reaction?: string | null
          effectiveness_rating?: number | null
          id?: string
          response_library_id?: string
          response_sent?: string | null
          used_by?: string | null
          workstream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_usage_response_library_id_fkey"
            columns: ["response_library_id"]
            isOneToOne: false
            referencedRelation: "response_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_usage_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "response_usage_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          is_manager_role: boolean | null
          is_system_role: boolean
          is_work_routing: boolean | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_manager_role?: boolean | null
          is_system_role?: boolean
          is_work_routing?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          is_manager_role?: boolean | null
          is_system_role?: boolean
          is_work_routing?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      step_definition_bricks: {
        Row: {
          brick_id: string
          created_at: string
          execution_condition: Json | null
          id: string
          input_config: Json
          output_mapping: Json | null
          position: number
          step_definition_id: string
        }
        Insert: {
          brick_id: string
          created_at?: string
          execution_condition?: Json | null
          id?: string
          input_config?: Json
          output_mapping?: Json | null
          position: number
          step_definition_id: string
        }
        Update: {
          brick_id?: string
          created_at?: string
          execution_condition?: Json | null
          id?: string
          input_config?: Json
          output_mapping?: Json | null
          position?: number
          step_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_definition_bricks_brick_id_fkey"
            columns: ["brick_id"]
            isOneToOne: false
            referencedRelation: "bricks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_definition_bricks_step_definition_id_fkey"
            columns: ["step_definition_id"]
            isOneToOne: false
            referencedRelation: "step_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      step_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_system: boolean
          is_template: boolean
          legacy_step_type: string | null
          name: string
          updated_at: string
          workstream_type_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_system?: boolean
          is_template?: boolean
          legacy_step_type?: string | null
          name: string
          updated_at?: string
          workstream_type_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          is_template?: boolean
          legacy_step_type?: string | null
          name?: string
          updated_at?: string
          workstream_type_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          tag_category: string | null
          tag_name: string
          usage_count: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          tag_category?: string | null
          tag_name: string
          usage_count?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          tag_category?: string | null
          tag_name?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          is_default: boolean | null
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_default?: boolean | null
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_default?: boolean | null
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      user_customizations: {
        Row: {
          created_at: string
          id: string
          sports_theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sports_theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sports_theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_edges: {
        Row: {
          condition: Json | null
          created_at: string
          edge_type: string
          id: string
          label: string | null
          metadata: Json | null
          play_id: string
          source_node_id: string
          target_node_id: string
        }
        Insert: {
          condition?: Json | null
          created_at?: string
          edge_type?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          play_id: string
          source_node_id: string
          target_node_id: string
        }
        Update: {
          condition?: Json | null
          created_at?: string
          edge_type?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          play_id?: string
          source_node_id?: string
          target_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_edges_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "playbook_plays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "workflow_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_nodes: {
        Row: {
          brick_id: string | null
          config: Json
          created_at: string
          id: string
          metadata: Json | null
          node_type: string
          play_id: string
          position_x: number | null
          position_y: number | null
        }
        Insert: {
          brick_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          node_type: string
          play_id: string
          position_x?: number | null
          position_y?: number | null
        }
        Update: {
          brick_id?: string | null
          config?: Json
          created_at?: string
          id?: string
          metadata?: Json | null
          node_type?: string
          play_id?: string
          position_x?: number | null
          position_y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_nodes_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "playbook_plays"
            referencedColumns: ["id"]
          },
        ]
      }
      workstream_activity: {
        Row: {
          activity_type: string
          actor_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          workstream_id: string
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          workstream_id: string
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          workstream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workstream_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstream_activity_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      workstream_approvals: {
        Row: {
          approval_template_id: string | null
          completed_at: string | null
          created_at: string
          current_gate: number | null
          id: string
          status: string | null
          submitted_at: string | null
          updated_at: string
          workstream_id: string | null
        }
        Insert: {
          approval_template_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_gate?: number | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          workstream_id?: string | null
        }
        Update: {
          approval_template_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_gate?: number | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          workstream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workstream_approvals_approval_template_id_fkey"
            columns: ["approval_template_id"]
            isOneToOne: false
            referencedRelation: "approval_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstream_approvals_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      workstream_documents: {
        Row: {
          created_at: string | null
          document_type: string
          error_message: string | null
          file_format: string | null
          id: string
          metadata: Json | null
          status: string
          step_id: string | null
          storage_path: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          workstream_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          error_message?: string | null
          file_format?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          step_id?: string | null
          storage_path?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          workstream_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          error_message?: string | null
          file_format?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          step_id?: string | null
          storage_path?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          workstream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workstream_documents_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "workstream_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstream_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstream_documents_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      workstream_steps: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          config: Json | null
          created_at: string
          id: string
          position: number
          required_before: string | null
          requirement_type: string
          status: string
          step_id: string
          step_type: string
          trigger_timing: string | null
          updated_at: string
          workstream_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          position?: number
          required_before?: string | null
          requirement_type?: string
          status?: string
          step_id: string
          step_type: string
          trigger_timing?: string | null
          updated_at?: string
          workstream_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          position?: number
          required_before?: string | null
          requirement_type?: string
          status?: string
          step_id?: string
          step_type?: string
          trigger_timing?: string | null
          updated_at?: string
          workstream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workstream_steps_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workstream_steps_workstream_id_fkey"
            columns: ["workstream_id"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["id"]
          },
        ]
      }
      workstream_types: {
        Row: {
          approval_template_id: string | null
          auto_approval_config: Json | null
          created_at: string
          created_by: string | null
          default_needs: Json | null
          default_workflow: string | null
          description: string | null
          display_name: string | null
          id: string
          name: string
          play_approval_config: Json | null
          required_documents: string[] | null
          status: string | null
          team_category: string | null
          updated_at: string
          version: number
        }
        Insert: {
          approval_template_id?: string | null
          auto_approval_config?: Json | null
          created_at?: string
          created_by?: string | null
          default_needs?: Json | null
          default_workflow?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          name: string
          play_approval_config?: Json | null
          required_documents?: string[] | null
          status?: string | null
          team_category?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          approval_template_id?: string | null
          auto_approval_config?: Json | null
          created_at?: string
          created_by?: string | null
          default_needs?: Json | null
          default_workflow?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          name?: string
          play_approval_config?: Json | null
          required_documents?: string[] | null
          status?: string | null
          team_category?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "workstream_types_approval_template_id_fkey"
            columns: ["approval_template_id"]
            isOneToOne: false
            referencedRelation: "approval_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workstreams: {
        Row: {
          actual_close_date: string | null
          annual_value: number | null
          business_objective: string | null
          counterparty_id: string | null
          created_at: string
          current_node_ids: string[] | null
          expected_close_date: string | null
          id: string
          name: string
          notes: string | null
          owner_id: string | null
          play_id: string | null
          playbook_id: string | null
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
          current_node_ids?: string[] | null
          expected_close_date?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_id?: string | null
          play_id?: string | null
          playbook_id?: string | null
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
          current_node_ids?: string[] | null
          expected_close_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_id?: string | null
          play_id?: string | null
          playbook_id?: string | null
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
      get_role_members: { Args: { role_uuid: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_ids: { Args: { _user_id?: string }; Returns: string[] }
      get_user_work_routing_roles: {
        Args: { _user_id?: string }
        Returns: string[]
      }
      has_business_role: { Args: { _user_id?: string }; Returns: boolean }
      has_permission: {
        Args: { _permission_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_custom_role: {
        Args: {
          _user_id: string
          custom_role_id?: string
          legacy_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_workstream_access: {
        Args: { _user_id?: string; ws_id: string }
        Returns: boolean
      }
      is_manager: { Args: { _user_id?: string }; Returns: boolean }
      is_manager_for_scope: {
        Args: { _user_id?: string; scope_role_id?: string }
        Returns: boolean
      }
      is_role_member: {
        Args: { role_uuid: string; user_uuid: string }
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
  graphql_public: {
    Enums: {},
  },
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
