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
      invoice_service_details: {
        Row: {
          created_at: string | null
          invoice_detail_id: string
          invoice_parent_id: string
          package_id: string | null
          quantity: number | null
          service_id: string | null
          sparepart_id: string | null
          subtotal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          invoice_detail_id?: string
          invoice_parent_id: string
          package_id?: string | null
          quantity?: number | null
          service_id?: string | null
          sparepart_id?: string | null
          subtotal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          invoice_detail_id?: string
          invoice_parent_id?: string
          package_id?: string | null
          quantity?: number | null
          service_id?: string | null
          sparepart_id?: string | null
          subtotal?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_service_details_invoice_parent_id_fkey"
            columns: ["invoice_parent_id"]
            isOneToOne: false
            referencedRelation: "invoice_services"
            referencedColumns: ["invoice_parent_id"]
          },
          {
            foreignKeyName: "invoice_service_details_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "invoice_service_details_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "invoice_service_details_sparepart_id_fkey"
            columns: ["sparepart_id"]
            isOneToOne: false
            referencedRelation: "spareparts"
            referencedColumns: ["sparepart_id"]
          },
        ]
      }
      invoice_services: {
        Row: {
          created_at: string | null
          date: string | null
          invoice_number: string
          invoice_parent_id: string
          notes: string | null
          total_amount: number | null
          discount: number | null
          updated_at: string | null
          vehicle_id: string | null
          workshop_id: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          invoice_number: string
          invoice_parent_id?: string
          notes?: string | null
          total_amount?: number | null
          discount?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
          workshop_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          invoice_number?: string
          invoice_parent_id?: string
          notes?: string | null
          total_amount?: number | null
          discount?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "invoice_services_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["workshop_id"]
          },
        ]
      }
      package_spareparts: {
        Row: {
          created_at: string | null
          package_id: string
          package_sparepart_id: string
          quantity: number | null
          sparepart_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          package_id: string
          package_sparepart_id?: string
          quantity?: number | null
          sparepart_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          package_id?: string
          package_sparepart_id?: string
          quantity?: number | null
          sparepart_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_spareparts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["package_id"]
          },
          {
            foreignKeyName: "package_spareparts_sparepart_id_fkey"
            columns: ["sparepart_id"]
            isOneToOne: false
            referencedRelation: "spareparts"
            referencedColumns: ["sparepart_id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          name: string
          package_id: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          name: string
          package_id?: string
          price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          name?: string
          package_id?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          name: string
          price: number
          service_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          name: string
          price?: number
          service_id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          name?: string
          price?: number
          service_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spareparts: {
        Row: {
          brand: string | null
          created_at: string | null
          name: string
          price: number
          sparepart_id: string
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          name: string
          price?: number
          sparepart_id?: string
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          name?: string
          price?: number
          sparepart_id?: string
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          created_at: string | null
          mileage: number | null
          model: string | null
          plate_number: string
          updated_at: string | null
          user_id: string
          vehicle_id: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          mileage?: number | null
          model?: string | null
          plate_number: string
          updated_at?: string | null
          user_id: string
          vehicle_id?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          mileage?: number | null
          model?: string | null
          plate_number?: string
          updated_at?: string | null
          user_id?: string
          vehicle_id?: string
          year?: number | null
        }
        Relationships: []
      }
      workshops: {
        Row: {
          address: string | null
          created_at: string | null
          name: string
          open_hours: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
          workshop_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          name: string
          open_hours?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
          workshop_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          name?: string
          open_hours?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
          workshop_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff_or_owner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "staff" | "customer"
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
      app_role: ["owner", "staff", "customer"],
    },
  },
} as const
