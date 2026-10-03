// Supabase'dan generatsiya qilingan: `pnpm db:types`. Qo'lda o'zgartirilmaydi.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      ad_spend: {
        Row: { amount: number; created_at: string; id: string; source: string; updated_at: string; week_start: string };
        Insert: { amount: number; created_at?: string; id?: string; source: string; updated_at?: string; week_start: string };
        Update: { amount?: number; created_at?: string; id?: string; source?: string; updated_at?: string; week_start?: string };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          channel: Database["public"]["Enums"]["channel"];
          content: string;
          created_at: string;
          id: string;
          role: string;
          session_id: string;
        };
        Insert: {
          channel?: Database["public"]["Enums"]["channel"];
          content: string;
          created_at?: string;
          id?: string;
          role: string;
          session_id: string;
        };
        Update: {
          channel?: Database["public"]["Enums"]["channel"];
          content?: string;
          created_at?: string;
          id?: string;
          role?: string;
          session_id?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          cancel_token: string;
          confirmed_at: string | null;
          created_at: string;
          demo_accelerated: boolean;
          feedback_alerted_at: string | null;
          feedback_score: number | null;
          followup_sent_at: string | null;
          id: string;
          lead_id: string;
          reminder_24h_sent_at: string | null;
          reminder_2h_sent_at: string | null;
          slot_id: string;
          status: Database["public"]["Enums"]["booking_status"];
          student_id: string | null;
          tg_chat_id: number | null;
          updated_at: string;
        };
        Insert: {
          cancel_token?: string;
          confirmed_at?: string | null;
          created_at?: string;
          demo_accelerated?: boolean;
          feedback_alerted_at?: string | null;
          feedback_score?: number | null;
          followup_sent_at?: string | null;
          id?: string;
          lead_id: string;
          reminder_24h_sent_at?: string | null;
          reminder_2h_sent_at?: string | null;
          slot_id: string;
          status?: Database["public"]["Enums"]["booking_status"];
          student_id?: string | null;
          tg_chat_id?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "bookings_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_slot_id_fkey"; columns: ["slot_id"]; isOneToOne: false; referencedRelation: "trial_slots"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] },
        ];
      };
      branches: {
        Row: {
          address_en: string;
          address_ru: string;
          address_uz: string;
          created_at: string;
          id: string;
          is_active: boolean;
          landmark_en: string | null;
          landmark_ru: string | null;
          landmark_uz: string | null;
          lat: number;
          lng: number;
          name_en: string;
          name_ru: string;
          name_uz: string;
          phone: string;
          photo_url: string | null;
          slug: string;
          sort: number;
          updated_at: string;
          working_hours_en: string;
          working_hours_ru: string;
          working_hours_uz: string;
        };
        Insert: {
          address_en: string;
          address_ru: string;
          address_uz: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          landmark_en?: string | null;
          landmark_ru?: string | null;
          landmark_uz?: string | null;
          lat: number;
          lng: number;
          name_en: string;
          name_ru: string;
          name_uz: string;
          phone: string;
          photo_url?: string | null;
          slug: string;
          sort?: number;
          updated_at?: string;
          working_hours_en: string;
          working_hours_ru: string;
          working_hours_uz: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
        Relationships: [];
      };
      courses: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"];
          created_at: string;
          description_en: string;
          description_ru: string;
          description_uz: string;
          direction_id: string;
          duration_months: number;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          lesson_minutes: number;
          lessons_per_week: number;
          level_from: number;
          level_to: number;
          price_monthly: number;
          program_en: string[];
          program_ru: string[];
          program_uz: string[];
          slug: string;
          sort: number;
          title_en: string;
          title_ru: string;
          title_uz: string;
          updated_at: string;
        };
        Insert: {
          age_group: Database["public"]["Enums"]["age_group"];
          created_at?: string;
          description_en: string;
          description_ru: string;
          description_uz: string;
          direction_id: string;
          duration_months: number;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          lesson_minutes: number;
          lessons_per_week: number;
          level_from?: number;
          level_to?: number;
          price_monthly: number;
          program_en?: string[];
          program_ru?: string[];
          program_uz?: string[];
          slug: string;
          sort?: number;
          title_en: string;
          title_ru: string;
          title_uz: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "courses_direction_id_fkey"; columns: ["direction_id"]; isOneToOne: false; referencedRelation: "directions"; referencedColumns: ["id"] },
        ];
      };
      directions: {
        Row: {
          color: string;
          created_at: string;
          has_test: boolean;
          icon: string;
          id: string;
          is_active: boolean;
          name_en: string;
          name_ru: string;
          name_uz: string;
          slug: string;
          sort: number;
          updated_at: string;
        };
        Insert: {
          color: string;
          created_at?: string;
          has_test?: boolean;
          icon: string;
          id?: string;
          is_active?: boolean;
          name_en: string;
          name_ru: string;
          name_uz: string;
          slug: string;
          sort?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["directions"]["Insert"]>;
        Relationships: [];
      };
      faq: {
        Row: {
          answer_en: string;
          answer_ru: string;
          answer_uz: string;
          created_at: string;
          id: string;
          is_active: boolean;
          question_en: string;
          question_ru: string;
          question_uz: string;
          sort: number;
          updated_at: string;
        };
        Insert: {
          answer_en: string;
          answer_ru: string;
          answer_uz: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          question_en: string;
          question_ru: string;
          question_uz: string;
          sort?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["faq"]["Insert"]>;
        Relationships: [];
      };
      groups: {
        Row: {
          branch_id: string;
          capacity: number;
          course_id: string;
          created_at: string;
          enrolled_count: number;
          id: string;
          is_open: boolean;
          schedule_text_en: string;
          schedule_text_ru: string;
          schedule_text_uz: string;
          start_date: string;
          teacher_id: string | null;
          updated_at: string;
        };
        Insert: {
          branch_id: string;
          capacity: number;
          course_id: string;
          created_at?: string;
          enrolled_count?: number;
          id?: string;
          is_open?: boolean;
          schedule_text_en: string;
          schedule_text_ru: string;
          schedule_text_uz: string;
          start_date: string;
          teacher_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "groups_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "groups_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
          { foreignKeyName: "groups_teacher_id_fkey"; columns: ["teacher_id"]; isOneToOne: false; referencedRelation: "teachers"; referencedColumns: ["id"] },
        ];
      };
      lead_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          from_status: Database["public"]["Enums"]["lead_status"] | null;
          id: string;
          lead_id: string;
          payload: Json;
          to_status: Database["public"]["Enums"]["lead_status"] | null;
          type: string;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          from_status?: Database["public"]["Enums"]["lead_status"] | null;
          id?: string;
          lead_id: string;
          payload?: Json;
          to_status?: Database["public"]["Enums"]["lead_status"] | null;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_events"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "lead_events_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "lead_events_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
        ];
      };
      leads: {
        Row: {
          assigned_to: string | null;
          channel: Database["public"]["Enums"]["channel"];
          course_id: string | null;
          created_at: string;
          direction_id: string | null;
          first_contact_at: string | null;
          full_name: string;
          group_notified_at: string | null;
          id: string;
          is_demo_live: boolean;
          locale: Database["public"]["Enums"]["locale"];
          lost_reason: Database["public"]["Enums"]["lost_reason"] | null;
          operator_requested: boolean;
          paid_amount: number | null;
          paid_at: string | null;
          phone: string;
          ref_attempt_id: string | null;
          referrer: string | null;
          sla_alerted_at: string | null;
          sla_escalated_at: string | null;
          source: string;
          status: Database["public"]["Enums"]["lead_status"];
          test_attempt_id: string | null;
          tg_chat_id: number | null;
          tg_username: string | null;
          updated_at: string;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          channel?: Database["public"]["Enums"]["channel"];
          course_id?: string | null;
          created_at?: string;
          direction_id?: string | null;
          first_contact_at?: string | null;
          full_name: string;
          group_notified_at?: string | null;
          id?: string;
          is_demo_live?: boolean;
          locale?: Database["public"]["Enums"]["locale"];
          lost_reason?: Database["public"]["Enums"]["lost_reason"] | null;
          operator_requested?: boolean;
          paid_amount?: number | null;
          paid_at?: string | null;
          phone: string;
          ref_attempt_id?: string | null;
          referrer?: string | null;
          sla_alerted_at?: string | null;
          sla_escalated_at?: string | null;
          source?: string;
          status?: Database["public"]["Enums"]["lead_status"];
          test_attempt_id?: string | null;
          tg_chat_id?: number | null;
          tg_username?: string | null;
          updated_at?: string;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "leads_assigned_to_fkey"; columns: ["assigned_to"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_direction_id_fkey"; columns: ["direction_id"]; isOneToOne: false; referencedRelation: "directions"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_ref_attempt_fk"; columns: ["ref_attempt_id"]; isOneToOne: false; referencedRelation: "test_attempts"; referencedColumns: ["id"] },
          { foreignKeyName: "leads_test_attempt_fk"; columns: ["test_attempt_id"]; isOneToOne: false; referencedRelation: "test_attempts"; referencedColumns: ["id"] },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["user_role"];
          tg_user_id: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["user_role"];
          tg_user_id?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      settings: {
        Row: { created_at: string; key: string; updated_at: string; value: Json };
        Insert: { created_at?: string; key: string; updated_at?: string; value: Json };
        Update: { created_at?: string; key?: string; updated_at?: string; value?: Json };
        Relationships: [];
      };
      students: {
        Row: { age: number | null; created_at: string; full_name: string; id: string; lead_id: string; updated_at: string };
        Insert: { age?: number | null; created_at?: string; full_name: string; id?: string; lead_id: string; updated_at?: string };
        Update: { age?: number | null; created_at?: string; full_name?: string; id?: string; lead_id?: string; updated_at?: string };
        Relationships: [
          { foreignKeyName: "students_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
        ];
      };
      teachers: {
        Row: {
          bio_en: string;
          bio_ru: string;
          bio_uz: string;
          certificates: string[];
          created_at: string;
          direction_id: string;
          experience_years: number;
          full_name: string;
          id: string;
          is_active: boolean;
          photo_url: string | null;
          sort: number;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          bio_en: string;
          bio_ru: string;
          bio_uz: string;
          certificates?: string[];
          created_at?: string;
          direction_id: string;
          experience_years?: number;
          full_name: string;
          id?: string;
          is_active?: boolean;
          photo_url?: string | null;
          sort?: number;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["teachers"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "teachers_direction_id_fkey"; columns: ["direction_id"]; isOneToOne: false; referencedRelation: "directions"; referencedColumns: ["id"] },
        ];
      };
      test_attempts: {
        Row: {
          answers: Json;
          channel: Database["public"]["Enums"]["channel"];
          created_at: string;
          direction_id: string;
          finished_at: string | null;
          id: string;
          lead_id: string | null;
          locale: Database["public"]["Enums"]["locale"];
          max_score: number | null;
          question_ids: string[];
          recommended_course_id: string | null;
          result_level: number | null;
          result_track: string | null;
          score: number | null;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          answers?: Json;
          channel?: Database["public"]["Enums"]["channel"];
          created_at?: string;
          direction_id: string;
          finished_at?: string | null;
          id?: string;
          lead_id?: string | null;
          locale?: Database["public"]["Enums"]["locale"];
          max_score?: number | null;
          question_ids: string[];
          recommended_course_id?: string | null;
          result_level?: number | null;
          result_track?: string | null;
          score?: number | null;
          session_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["test_attempts"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "test_attempts_direction_id_fkey"; columns: ["direction_id"]; isOneToOne: false; referencedRelation: "directions"; referencedColumns: ["id"] },
          { foreignKeyName: "test_attempts_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
          { foreignKeyName: "test_attempts_recommended_course_id_fkey"; columns: ["recommended_course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
        ];
      };
      test_questions: {
        Row: {
          correct_key: string | null;
          created_at: string;
          direction_id: string;
          id: string;
          is_active: boolean;
          level: number;
          options: Json;
          question: Json;
          sort: number;
          updated_at: string;
          weight: number;
        };
        Insert: {
          correct_key?: string | null;
          created_at?: string;
          direction_id: string;
          id?: string;
          is_active?: boolean;
          level: number;
          options: Json;
          question: Json;
          sort?: number;
          updated_at?: string;
          weight?: number;
        };
        Update: Partial<Database["public"]["Tables"]["test_questions"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "test_questions_direction_id_fkey"; columns: ["direction_id"]; isOneToOne: false; referencedRelation: "directions"; referencedColumns: ["id"] },
        ];
      };
      testimonials: {
        Row: {
          achievement_en: string;
          achievement_ru: string;
          achievement_uz: string;
          created_at: string;
          direction_id: string | null;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          name: string;
          photo_url: string | null;
          sort: number;
          text_en: string;
          text_ru: string;
          text_uz: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          achievement_en: string;
          achievement_ru: string;
          achievement_uz: string;
          created_at?: string;
          direction_id?: string | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name: string;
          photo_url?: string | null;
          sort?: number;
          text_en: string;
          text_ru: string;
          text_uz: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "testimonials_direction_id_fkey"; columns: ["direction_id"]; isOneToOne: false; referencedRelation: "directions"; referencedColumns: ["id"] },
        ];
      };
      tg_sessions: {
        Row: {
          chat_id: number;
          created_at: string;
          lead_id: string | null;
          locale: Database["public"]["Enums"]["locale"];
          state: Json;
          updated_at: string;
        };
        Insert: {
          chat_id: number;
          created_at?: string;
          lead_id?: string | null;
          locale?: Database["public"]["Enums"]["locale"];
          state?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tg_sessions"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "tg_sessions_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "leads"; referencedColumns: ["id"] },
        ];
      };
      trial_slots: {
        Row: {
          booked_count: number;
          branch_id: string;
          capacity: number;
          created_at: string;
          direction_id: string;
          duration_min: number;
          id: string;
          starts_at: string;
          updated_at: string;
        };
        Insert: {
          booked_count?: number;
          branch_id: string;
          capacity: number;
          created_at?: string;
          direction_id: string;
          duration_min?: number;
          id?: string;
          starts_at: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["trial_slots"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "trial_slots_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "trial_slots_direction_id_fkey"; columns: ["direction_id"]; isOneToOne: false; referencedRelation: "directions"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      book_trial: {
        Args: { p_demo_accelerated?: boolean; p_lead_id: string; p_slot_id: string; p_student_id?: string };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      current_role_name: { Args: never; Returns: Database["public"]["Enums"]["user_role"] };
      is_admin: { Args: never; Returns: boolean };
      is_staff: { Args: never; Returns: boolean };
      lead_status_allowed: {
        Args: {
          from_s: Database["public"]["Enums"]["lead_status"];
          to_s: Database["public"]["Enums"]["lead_status"];
        };
        Returns: boolean;
      };
      reset_demo_data: { Args: never; Returns: Json };
      admin_dashboard: { Args: { p_from: string }; Returns: Json };
      claim_unnotified_leads: { Args: { p_limit?: number }; Returns: string[] };
      claim_sla_alerts: {
        Args: { p_minutes?: number };
        Returns: { id: string; full_name: string; phone: string; created_at: string }[];
      };
      claim_sla_escalations: {
        Args: { p_minutes?: number };
        Returns: { id: string; full_name: string; phone: string; created_at: string }[];
      };
      claim_reminders: {
        Args: { p_kind: string; p_demo_24h_seconds?: number; p_demo_2h_seconds?: number };
        Returns: { booking_id: string; chat_id: number; starts_at: string; demo: boolean }[];
      };
      claim_followups: {
        Args: { p_demo_seconds?: number };
        Returns: { booking_id: string; chat_id: number; kind: string }[];
      };
    };
    Enums: {
      age_group: "kids" | "teens" | "adults";
      booking_status: "booked" | "attended" | "no_show" | "cancelled";
      channel: "web" | "telegram" | "miniapp";
      lead_status: "new" | "contacted" | "trial_booked" | "trial_attended" | "paid" | "lost";
      locale: "uz" | "ru" | "en";
      lost_reason: "expensive" | "far" | "schedule" | "no_answer" | "other";
      user_role: "admin" | "manager";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];

export const Constants = {
  public: {
    Enums: {
      age_group: ["kids", "teens", "adults"],
      booking_status: ["booked", "attended", "no_show", "cancelled"],
      channel: ["web", "telegram", "miniapp"],
      lead_status: ["new", "contacted", "trial_booked", "trial_attended", "paid", "lost"],
      locale: ["uz", "ru", "en"],
      lost_reason: ["expensive", "far", "schedule", "no_answer", "other"],
      user_role: ["admin", "manager"],
    },
  },
} as const;
