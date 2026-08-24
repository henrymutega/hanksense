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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      class_invites: {
        Row: {
          class_id: string
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          uses: number
        }
        Insert: {
          class_id: string
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses?: number
        }
        Update: {
          class_id?: string
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_invites_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_memberships: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_memberships_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          course_code: string | null
          created_at: string
          description: string | null
          id: string
          lecturer_id: string
          name: string
          semester: string | null
        }
        Insert: {
          academic_year?: string | null
          course_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lecturer_id: string
          name: string
          semester?: string | null
        }
        Update: {
          academic_year?: string | null
          course_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lecturer_id?: string
          name?: string
          semester?: string | null
        }
        Relationships: []
      }
      lecturer_billing: {
        Row: {
          lecturer_id: string
          plan: string
          semester_ends_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          lecturer_id: string
          plan?: string
          semester_ends_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          lecturer_id?: string
          plan?: string
          semester_ends_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          institution: string | null
          phone: string | null
          student_id: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          institution?: string | null
          phone?: string | null
          student_id?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          institution?: string | null
          phone?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      session_candidates: {
        Row: {
          ai_explanation: string | null
          class_id: string
          created_at: string
          cv_summary: string | null
          cv_text: string | null
          email: string | null
          experience_years: number | null
          id: string
          job_id: string
          matching_skills: string[]
          missing_skills: string[]
          name: string
          recommendation: string | null
          score: number
          session_id: string
          skills: string[]
          stage: Database["public"]["Enums"]["candidate_stage"]
          updated_at: string
        }
        Insert: {
          ai_explanation?: string | null
          class_id: string
          created_at?: string
          cv_summary?: string | null
          cv_text?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          job_id: string
          matching_skills?: string[]
          missing_skills?: string[]
          name: string
          recommendation?: string | null
          score?: number
          session_id: string
          skills?: string[]
          stage?: Database["public"]["Enums"]["candidate_stage"]
          updated_at?: string
        }
        Update: {
          ai_explanation?: string | null
          class_id?: string
          created_at?: string
          cv_summary?: string | null
          cv_text?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          job_id?: string
          matching_skills?: string[]
          missing_skills?: string[]
          name?: string
          recommendation?: string | null
          score?: number
          session_id?: string
          skills?: string[]
          stage?: Database["public"]["Enums"]["candidate_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_candidates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "session_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_candidates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_jobs: {
        Row: {
          benefits: string[]
          bias_notes: Json
          class_id: string
          created_at: string
          created_by: string
          department: string | null
          education: string | null
          employment_type: string | null
          experience: string | null
          id: string
          interview_stages: string[]
          lecturer_id: string
          location: string | null
          openings: number
          preferred_skills: string[]
          required_skills: string[]
          responsibilities: string[]
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          seniority: string | null
          session_id: string
          status: Database["public"]["Enums"]["job_status"]
          summary: string | null
          title: string
          updated_at: string
          work_mode: string | null
        }
        Insert: {
          benefits?: string[]
          bias_notes?: Json
          class_id: string
          created_at?: string
          created_by: string
          department?: string | null
          education?: string | null
          employment_type?: string | null
          experience?: string | null
          id?: string
          interview_stages?: string[]
          lecturer_id: string
          location?: string | null
          openings?: number
          preferred_skills?: string[]
          required_skills?: string[]
          responsibilities?: string[]
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["job_status"]
          summary?: string | null
          title: string
          updated_at?: string
          work_mode?: string | null
        }
        Update: {
          benefits?: string[]
          bias_notes?: Json
          class_id?: string
          created_at?: string
          created_by?: string
          department?: string | null
          education?: string | null
          employment_type?: string | null
          experience?: string | null
          id?: string
          interview_stages?: string[]
          lecturer_id?: string
          location?: string | null
          openings?: number
          preferred_skills?: string[]
          required_skills?: string[]
          responsibilities?: string[]
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_jobs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_jobs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          id: string
          joined_at: string
          session_id: string
          student_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_id: string
          student_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          id: string
          join_code: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          title: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          id?: string
          join_code?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          title: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          id?: string
          join_code?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_self_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_member: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      job_is_lecturer_posted: { Args: { _job_id: string }; Returns: boolean }
      lecturer_can_read_student: {
        Args: { _lecturer_id: string; _student_id: string }
        Returns: boolean
      }
      owns_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      owns_session_job: {
        Args: { _job_id: string; _user_id: string }
        Returns: boolean
      }
      redeem_class_invite: { Args: { _code: string }; Returns: string }
      redeem_session_code: { Args: { _code: string }; Returns: string }
      set_lecturer_status: {
        Args: {
          _lecturer: string
          _status: Database["public"]["Enums"]["account_status"]
        }
        Returns: undefined
      }
      validate_student_code: {
        Args: { _code: string }
        Returns: {
          class_id: string
          class_name: string
          kind: string
          lecturer_id: string
          lecturer_name: string
        }[]
      }
    }
    Enums: {
      account_status: "pending" | "approved" | "suspended"
      app_role: "admin" | "lecturer" | "student"
      candidate_stage:
        | "applied"
        | "ai_screened"
        | "assessment"
        | "shortlisted"
        | "interview"
        | "offer"
        | "hired"
        | "rejected"
        | "talent_pool"
      job_status: "draft" | "posted" | "closed"
      session_status: "scheduled" | "live" | "ended" | "cancelled"
      subscription_status: "active" | "inactive" | "trial" | "expired"
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
      account_status: ["pending", "approved", "suspended"],
      app_role: ["admin", "lecturer", "student"],
      candidate_stage: [
        "applied",
        "ai_screened",
        "assessment",
        "shortlisted",
        "interview",
        "offer",
        "hired",
        "rejected",
        "talent_pool",
      ],
      job_status: ["draft", "posted", "closed"],
      session_status: ["scheduled", "live", "ended", "cancelled"],
      subscription_status: ["active", "inactive", "trial", "expired"],
    },
  },
} as const
