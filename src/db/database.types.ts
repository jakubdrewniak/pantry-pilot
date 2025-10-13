export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
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
      household_invitations: {
        Row: {
          created_at: string
          expires_at: string
          household_id: string
          id: string
          invited_email: string
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          household_id: string
          id?: string
          invited_email: string
          status?: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          household_id?: string
          id?: string
          invited_email?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: 'household_invitations_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pantries: {
        Row: {
          created_at: string
          household_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pantries_household_id_fkey'
            columns: ['household_id']
            isOneToOne: true
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      pantry_items: {
        Row: {
          id: string
          name: string
          pantry_id: string
          quantity: number
          unit: string | null
        }
        Insert: {
          id?: string
          name: string
          pantry_id: string
          quantity?: number
          unit?: string | null
        }
        Update: {
          id?: string
          name?: string
          pantry_id?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pantry_items_pantry_id_fkey'
            columns: ['pantry_id']
            isOneToOne: false
            referencedRelation: 'pantries'
            referencedColumns: ['id']
          },
        ]
      }
      recipes: {
        Row: {
          content: Json
          created_at: string
          creation_method: Database['public']['Enums']['recipe_creation_method']
          household_id: string
          id: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          creation_method?: Database['public']['Enums']['recipe_creation_method']
          household_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          creation_method?: Database['public']['Enums']['recipe_creation_method']
          household_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      shopping_list_items: {
        Row: {
          id: string
          is_purchased: boolean
          name: string
          quantity: number
          shopping_list_id: string
          unit: string | null
        }
        Insert: {
          id?: string
          is_purchased?: boolean
          name: string
          quantity?: number
          shopping_list_id: string
          unit?: string | null
        }
        Update: {
          id?: string
          is_purchased?: boolean
          name?: string
          quantity?: number
          shopping_list_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'shopping_list_items_shopping_list_id_fkey'
            columns: ['shopping_list_id']
            isOneToOne: false
            referencedRelation: 'shopping_lists'
            referencedColumns: ['id']
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          household_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shopping_lists_household_id_fkey'
            columns: ['household_id']
            isOneToOne: true
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
      user_households: {
        Row: {
          created_at: string
          household_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_households_household_id_fkey'
            columns: ['household_id']
            isOneToOne: false
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      recipe_creation_method: 'manual' | 'ai_generated' | 'ai_generated_modified'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      recipe_creation_method: ['manual', 'ai_generated', 'ai_generated_modified'],
    },
  },
} as const
