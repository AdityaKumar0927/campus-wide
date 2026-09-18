export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
      appeals: {
        Row: {
          action_id: string
          appellant_id: string
          created_at: string
          decision_reasons: string | null
          id: string
          resolved_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["appeal_status"]
          text: string
          university_id: string
        }
        Insert: {
          action_id: string
          appellant_id: string
          created_at?: string
          decision_reasons?: string | null
          id?: string
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["appeal_status"]
          text: string
          university_id: string
        }
        Update: {
          action_id?: string
          appellant_id?: string
          created_at?: string
          decision_reasons?: string | null
          id?: string
          resolved_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["appeal_status"]
          text?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeals_action_id_moderation_actions_id_fk"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "moderation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeals_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          details: Json
          id: string
          ip: unknown
          ip_hash: string | null
          target_id: string | null
          target_type: string | null
          university_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip?: unknown
          ip_hash?: string | null
          target_id?: string | null
          target_type?: string | null
          university_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          id?: string
          ip?: unknown
          ip_hash?: string | null
          target_id?: string | null
          target_type?: string | null
          university_id?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
          university_id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
          university_id: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          is_accepted: boolean
          parent_id: string | null
          post_id: string
          status: Database["public"]["Enums"]["comment_status"]
          thanks_count: number
          university_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_accepted?: boolean
          parent_id?: string | null
          post_id: string
          status?: Database["public"]["Enums"]["comment_status"]
          thanks_count?: number
          university_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_accepted?: boolean
          parent_id?: string | null
          post_id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          thanks_count?: number
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_profiles_user_id_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_parent_id_comments_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_posts_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          accepted: boolean
          choice: string
          context: Json
          created_at: string
          deleted_at: string | null
          id: string
          ip_hash: string | null
          policy_version_id: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted: boolean
          choice: string
          context?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          policy_version_id: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted?: boolean
          choice?: string
          context?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_hash?: string | null
          policy_version_id?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_policy_version_id_policy_versions_id_fk"
            columns: ["policy_version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      digest_runs: {
        Row: {
          created_at: string
          details: Json
          id: string
          period_end: string
          period_start: string
          recipients: number
          sent: number
          skipped: number
          university_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          period_end: string
          period_start: string
          recipients?: number
          sent?: number
          skipped?: number
          university_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          period_end?: string
          period_start?: string
          recipients?: number
          sent?: number
          skipped?: number
          university_id?: string
        }
        Relationships: []
      }
      domain_requests: {
        Row: {
          created_at: string
          deleted_at: string | null
          domain: string
          email_hash: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["domain_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          domain: string
          email_hash: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["domain_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          domain?: string
          email_hash?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["domain_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      email_sends: {
        Row: {
          created_at: string
          id: string
          kind: string
          provider: string
          recipient_hash: string
          status: string
          university_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          provider?: string
          recipient_hash: string
          status?: string
          university_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          provider?: string
          recipient_hash?: string
          status?: string
          university_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          consent: boolean
          created_at: string
          forwarded_to: string | null
          id: string
          message: string
          page_url: string | null
          sentiment: Database["public"]["Enums"]["feedback_sentiment"]
          university_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent?: boolean
          created_at?: string
          forwarded_to?: string | null
          id?: string
          message: string
          page_url?: string | null
          sentiment: Database["public"]["Enums"]["feedback_sentiment"]
          university_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent?: boolean
          created_at?: string
          forwarded_to?: string | null
          id?: string
          message?: string
          page_url?: string | null
          sentiment?: Database["public"]["Enums"]["feedback_sentiment"]
          university_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          campus_role: Database["public"]["Enums"]["campus_role"]
          created_at: string
          deleted_at: string | null
          id: string
          last_sign_in_at: string | null
          sso_provider_id: string | null
          status: Database["public"]["Enums"]["membership_status"]
          status_reason: string | null
          suspended_until: string | null
          university_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_term: string | null
        }
        Insert: {
          campus_role?: Database["public"]["Enums"]["campus_role"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_sign_in_at?: string | null
          sso_provider_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          status_reason?: string | null
          suspended_until?: string | null
          university_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_term?: string | null
        }
        Update: {
          campus_role?: Database["public"]["Enums"]["campus_role"]
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_sign_in_at?: string | null
          sso_provider_id?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          status_reason?: string | null
          suspended_until?: string | null
          university_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["moderation_kind"]
          moderator_id: string
          report_id: string | null
          reversed_at: string | null
          reversed_by: string | null
          statement_of_reasons: Json
          subject_id: string | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["report_target"] | null
          university_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["moderation_kind"]
          moderator_id: string
          report_id?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          statement_of_reasons: Json
          subject_id?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["report_target"] | null
          university_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["moderation_kind"]
          moderator_id?: string
          report_id?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          statement_of_reasons?: Json
          subject_id?: string | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["report_target"] | null
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_reports_id_fk"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_subject_id_profiles_user_id_fk"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "moderation_actions_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      mutes: {
        Row: {
          created_at: string
          id: string
          muted_id: string
          muter_id: string
          university_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muted_id: string
          muter_id: string
          university_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muted_id?: string
          muter_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutes_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          read_at: string | null
          target_id: string | null
          target_type: string | null
          title: string
          university_id: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          read_at?: string | null
          target_id?: string | null
          target_type?: string | null
          title: string
          university_id: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          read_at?: string | null
          target_id?: string | null
          target_type?: string | null
          title?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_profiles_user_id_fk"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_versions: {
        Row: {
          content_hash: string
          content_path: string
          created_at: string
          deleted_at: string | null
          effective_at: string
          id: string
          required: boolean
          slug: string
          summary: string | null
          title: string
          university_id: string | null
          updated_at: string
          version: string
        }
        Insert: {
          content_hash: string
          content_path: string
          created_at?: string
          deleted_at?: string | null
          effective_at?: string
          id?: string
          required?: boolean
          slug: string
          summary?: string | null
          title: string
          university_id?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          content_hash?: string
          content_path?: string
          created_at?: string
          deleted_at?: string | null
          effective_at?: string
          id?: string
          required?: boolean
          slug?: string
          summary?: string | null
          title?: string
          university_id?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          options: number[]
          post_id: string
          university_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options: number[]
          post_id: string
          university_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: number[]
          post_id?: string
          university_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_post_id_posts_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      post_participants: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["participant_kind"]
          post_id: string
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["participant_kind"]
          post_id: string
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["participant_kind"]
          post_id?: string
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_participants_post_id_posts_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_participants_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_participants_user_id_profiles_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          accepted_comment_id: string | null
          audience: Database["public"]["Enums"]["post_audience"]
          author_id: string | null
          body: string
          comment_count: number
          created_at: string
          deleted_at: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          images: Json
          last_activity_at: string
          payload: Json
          resolved_at: string | null
          search: unknown
          space_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          thanks_count: number
          title: string
          type: Database["public"]["Enums"]["post_type"]
          university_id: string
          updated_at: string
        }
        Insert: {
          accepted_comment_id?: string | null
          audience?: Database["public"]["Enums"]["post_audience"]
          author_id?: string | null
          body?: string
          comment_count?: number
          created_at?: string
          deleted_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          images?: Json
          last_activity_at?: string
          payload?: Json
          resolved_at?: string | null
          search?: unknown
          space_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          thanks_count?: number
          title: string
          type: Database["public"]["Enums"]["post_type"]
          university_id: string
          updated_at?: string
        }
        Update: {
          accepted_comment_id?: string | null
          audience?: Database["public"]["Enums"]["post_audience"]
          author_id?: string | null
          body?: string
          comment_count?: number
          created_at?: string
          deleted_at?: string | null
          embedding?: string | null
          expires_at?: string | null
          id?: string
          images?: Json
          last_activity_at?: string
          payload?: Json
          resolved_at?: string | null
          search?: unknown
          space_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          thanks_count?: number
          title?: string
          type?: Database["public"]["Enums"]["post_type"]
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_profiles_user_id_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_space_id_spaces_id_fk"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          campus_username: string
          class_year: number | null
          created_at: string
          deleted_at: string | null
          display_name: string
          email_digest: boolean
          helped_count: number
          id: string
          initials: string
          meal_plan_attested_at: string | null
          meal_plan_attested_term: string | null
          onboarded_at: string | null
          privacy_mode: boolean
          thanks_count: number
          university_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          campus_username: string
          class_year?: number | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          email_digest?: boolean
          helped_count?: number
          id?: string
          initials: string
          meal_plan_attested_at?: string | null
          meal_plan_attested_term?: string | null
          onboarded_at?: string | null
          privacy_mode?: boolean
          thanks_count?: number
          university_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          campus_username?: string
          class_year?: number | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          email_digest?: boolean
          helped_count?: number
          id?: string
          initials?: string
          meal_plan_attested_at?: string | null
          meal_plan_attested_term?: string | null
          onboarded_at?: string | null
          privacy_mode?: boolean
          thanks_count?: number
          university_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_events: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["reaction_kind"]
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          university_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          university_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["reaction_kind"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["reaction_target"]
          university_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_messages: {
        Row: {
          body: string
          created_at: string
          flagged_words: string[]
          id: string
          sender_id: string
          thread_id: string
          university_id: string
        }
        Insert: {
          body: string
          created_at?: string
          flagged_words?: string[]
          id?: string
          sender_id: string
          thread_id: string
          university_id: string
        }
        Update: {
          body?: string
          created_at?: string
          flagged_words?: string[]
          id?: string
          sender_id?: string
          thread_id?: string
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_messages_sender_id_profiles_user_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "relay_messages_thread_id_relay_threads_id_fk"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "relay_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_messages_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_threads: {
        Row: {
          created_at: string
          deleted_at: string | null
          flagged: boolean
          id: string
          initiator_confirmed_at: string | null
          initiator_id: string
          initiator_share_email: boolean
          last_message_at: string | null
          message_count: number
          owner_confirmed_at: string | null
          owner_id: string
          owner_share_email: boolean
          post_id: string
          state: Database["public"]["Enums"]["relay_state"]
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          flagged?: boolean
          id?: string
          initiator_confirmed_at?: string | null
          initiator_id: string
          initiator_share_email?: boolean
          last_message_at?: string | null
          message_count?: number
          owner_confirmed_at?: string | null
          owner_id: string
          owner_share_email?: boolean
          post_id: string
          state?: Database["public"]["Enums"]["relay_state"]
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          flagged?: boolean
          id?: string
          initiator_confirmed_at?: string | null
          initiator_id?: string
          initiator_share_email?: boolean
          last_message_at?: string | null
          message_count?: number
          owner_confirmed_at?: string | null
          owner_id?: string
          owner_share_email?: boolean
          post_id?: string
          state?: Database["public"]["Enums"]["relay_state"]
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_threads_initiator_id_profiles_user_id_fk"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "relay_threads_owner_id_profiles_user_id_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "relay_threads_post_id_posts_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_threads_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_to: string | null
          case_number: string
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          escalation_consent: boolean
          evidence: Json
          id: string
          note: string | null
          reporter_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          subject_id: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          triage: Json | null
          university_id: string
        }
        Insert: {
          assigned_to?: string | null
          case_number: string
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          escalation_consent?: boolean
          evidence?: Json
          id?: string
          note?: string | null
          reporter_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject_id?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          triage?: Json | null
          university_id: string
        }
        Update: {
          assigned_to?: string | null
          case_number?: string
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          escalation_consent?: boolean
          evidence?: Json
          id?: string
          note?: string | null
          reporter_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          subject_id?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
          triage?: Json | null
          university_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_subject_id_profiles_user_id_fk"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reports_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      space_memberships: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          role: Database["public"]["Enums"]["space_role"]
          space_id: string
          university_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["space_role"]
          space_id: string
          university_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["space_role"]
          space_id?: string
          university_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_memberships_space_id_spaces_id_fk"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_memberships_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_default: boolean
          kind: Database["public"]["Enums"]["space_kind"]
          member_count: number
          name: string
          slug: string
          university_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          kind?: Database["public"]["Enums"]["space_kind"]
          member_count?: number
          name: string
          slug: string
          university_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          kind?: Database["public"]["Enums"]["space_kind"]
          member_count?: number
          name?: string
          slug?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          accent_hue: string
          country: string
          created_at: string
          deleted_at: string | null
          dining_locations: Json
          feature_flags: Json
          id: string
          name: string
          policy_text: Json
          safe_exchange_locations: Json
          settings: Json
          short_name: string | null
          slug: string
          status: Database["public"]["Enums"]["university_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          accent_hue?: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          dining_locations?: Json
          feature_flags?: Json
          id?: string
          name: string
          policy_text?: Json
          safe_exchange_locations?: Json
          settings?: Json
          short_name?: string | null
          slug: string
          status?: Database["public"]["Enums"]["university_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          accent_hue?: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          dining_locations?: Json
          feature_flags?: Json
          id?: string
          name?: string
          policy_text?: Json
          safe_exchange_locations?: Json
          settings?: Json
          short_name?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["university_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      university_domains: {
        Row: {
          created_at: string
          deleted_at: string | null
          domain: string
          hosted_domain: string | null
          id: string
          role: Database["public"]["Enums"]["campus_role"]
          source: Database["public"]["Enums"]["domain_source"]
          university_id: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          domain: string
          hosted_domain?: string | null
          id?: string
          role?: Database["public"]["Enums"]["campus_role"]
          source?: Database["public"]["Enums"]["domain_source"]
          university_id: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          domain?: string
          hosted_domain?: string | null
          id?: string
          role?: Database["public"]["Enums"]["campus_role"]
          source?: Database["public"]["Enums"]["domain_source"]
          university_id?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "university_domains_university_id_universities_id_fk"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_attested_at: string | null
          campus_username: string
          created_at: string
          declared_family_name: string | null
          declared_given_name: string | null
          deleted_at: string | null
          email: string
          email_domain: string
          id: string
          identity_provider: Database["public"]["Enums"]["identity_provider"]
          last_sign_in_at: string | null
          name_locked_at: string | null
          name_matches_username: boolean
          name_pending: boolean
          name_verified_in_person_at: string | null
          updated_at: string
        }
        Insert: {
          age_attested_at?: string | null
          campus_username: string
          created_at?: string
          declared_family_name?: string | null
          declared_given_name?: string | null
          deleted_at?: string | null
          email: string
          email_domain: string
          id: string
          identity_provider?: Database["public"]["Enums"]["identity_provider"]
          last_sign_in_at?: string | null
          name_locked_at?: string | null
          name_matches_username?: boolean
          name_pending?: boolean
          name_verified_in_person_at?: string | null
          updated_at?: string
        }
        Update: {
          age_attested_at?: string | null
          campus_username?: string
          created_at?: string
          declared_family_name?: string | null
          declared_given_name?: string | null
          deleted_at?: string | null
          email?: string
          email_domain?: string
          id?: string
          identity_provider?: Database["public"]["Enums"]["identity_provider"]
          last_sign_in_at?: string | null
          name_locked_at?: string | null
          name_matches_username?: boolean
          name_pending?: boolean
          name_verified_in_person_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_answer: { Args: { p_comment_id: string }; Returns: undefined }
      admin_campus_stats: { Args: never; Returns: Json }
      appeal: { Args: { p_action_id: string; p_text: string }; Returns: string }
      before_user_created_hook: { Args: { event: Json }; Returns: Json }
      cast_poll_vote: {
        Args: { p_options: number[]; p_post_id: string }
        Returns: undefined
      }
      current_term: { Args: never; Returns: string }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      decide_appeal: {
        Args: {
          p_appeal_id: string
          p_outcome: Database["public"]["Enums"]["appeal_status"]
          p_reasons: string
        }
        Returns: undefined
      }
      declare_name: {
        Args: { age_attested: boolean; family: string; given: string }
        Returns: undefined
      }
      export_relay_thread: { Args: { p_thread_id: string }; Returns: Json }
      file_report: {
        Args: {
          p_category: Database["public"]["Enums"]["report_category"]
          p_escalation?: boolean
          p_note?: string
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["report_target"]
        }
        Returns: string
      }
      is_allowed_email: { Args: { email: string }; Returns: boolean }
      list_my_sessions: {
        Args: never
        Returns: {
          created_at: string
          id: string
          ip: string
          is_current: boolean
          not_after: string
          refreshed_at: string
          user_agent: string
        }[]
      }
      mark_notifications_read: { Args: { p_ids?: string[] }; Returns: number }
      match_questions: {
        Args: { p_embedding: string; p_exclude?: string; p_limit?: number }
        Returns: {
          accepted_comment_id: string
          comment_count: number
          id: string
          similarity: number
          status: Database["public"]["Enums"]["post_status"]
          title: string
        }[]
      }
      moderate: {
        Args: {
          p_days?: number
          p_facts: string
          p_ground: string
          p_kind: Database["public"]["Enums"]["moderation_kind"]
          p_redress?: string
          p_report_id: string
          p_subject: string
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["report_target"]
        }
        Returns: string
      }
      poll_results: {
        Args: { p_post_id: string }
        Returns: {
          option_index: number
          votes: number
        }[]
      }
      public_campus_stats: { Args: { p_slug: string }; Returns: Json }
      relay_contact: {
        Args: { p_thread_id: string }
        Returns: {
          campus_username: string
          display_name: string
          email: string
        }[]
      }
      revoke_my_session: { Args: { session_id: string }; Returns: undefined }
      run_expire_posts: { Args: never; Returns: number }
      run_maintenance: { Args: never; Returns: Json }
      search_posts: {
        Args: { p_limit?: number; q: string }
        Returns: {
          accepted_comment_id: string | null
          audience: Database["public"]["Enums"]["post_audience"]
          author_id: string | null
          body: string
          comment_count: number
          created_at: string
          deleted_at: string | null
          embedding: string | null
          expires_at: string | null
          id: string
          images: Json
          last_activity_at: string
          payload: Json
          resolved_at: string | null
          search: unknown
          space_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          thanks_count: number
          title: string
          type: Database["public"]["Enums"]["post_type"]
          university_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      set_report_triage: {
        Args: { p_report_id: string; p_triage: Json }
        Returns: undefined
      }
      take_rate_limit: {
        Args: { p_action: string; p_max: number; p_window_seconds: number }
        Returns: undefined
      }
      toggle_thanks: {
        Args: {
          p_target_id: string
          p_target_type: Database["public"]["Enums"]["reaction_target"]
        }
        Returns: boolean
      }
      unread_notification_count: { Args: never; Returns: number }
    }
    Enums: {
      appeal_status: "open" | "upheld" | "overturned"
      campus_role:
        | "student"
        | "staff"
        | "alumni"
        | "moderator"
        | "university_admin"
      comment_status: "active" | "removed" | "deleted"
      domain_request_status: "pending" | "approved" | "rejected"
      domain_source: "hipo" | "admin" | "seed"
      feedback_sentiment: "love" | "good" | "meh" | "bad"
      identity_provider: "google" | "email" | "saml"
      membership_status: "active" | "read_only" | "suspended" | "banned"
      moderation_kind:
        | "hide"
        | "remove"
        | "warn"
        | "suspend"
        | "ban"
        | "restore"
        | "dismiss"
        | "privacy_mode"
      notification_kind:
        | "answer"
        | "comment"
        | "accepted"
        | "thanks"
        | "relay"
        | "moderation"
        | "system"
        | "digest"
      participant_kind: "rsvp" | "seat" | "member"
      post_audience: "campus" | "meal_holders"
      post_status: "active" | "resolved" | "expired" | "removed" | "deleted"
      post_type:
        | "question"
        | "notice"
        | "event"
        | "listing"
        | "meal"
        | "lost"
        | "found"
        | "ride"
        | "study"
        | "roommate"
        | "poll"
      reaction_kind: "thanks"
      reaction_target: "post" | "comment"
      relay_state: "open" | "closed" | "completed"
      report_category:
        | "harassment"
        | "stalking"
        | "scam"
        | "impersonation"
        | "hate"
        | "sexual"
        | "meal_resale"
        | "prohibited_item"
        | "spam"
        | "other"
      report_status: "open" | "in_review" | "actioned" | "dismissed"
      report_target: "post" | "comment" | "thread" | "profile"
      space_kind: "general" | "course" | "residence" | "club" | "interest"
      space_role: "member" | "organizer"
      university_status: "pending" | "active" | "paused"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      appeal_status: ["open", "upheld", "overturned"],
      campus_role: [
        "student",
        "staff",
        "alumni",
        "moderator",
        "university_admin",
      ],
      comment_status: ["active", "removed", "deleted"],
      domain_request_status: ["pending", "approved", "rejected"],
      domain_source: ["hipo", "admin", "seed"],
      feedback_sentiment: ["love", "good", "meh", "bad"],
      identity_provider: ["google", "email", "saml"],
      membership_status: ["active", "read_only", "suspended", "banned"],
      moderation_kind: [
        "hide",
        "remove",
        "warn",
        "suspend",
        "ban",
        "restore",
        "dismiss",
        "privacy_mode",
      ],
      notification_kind: [
        "answer",
        "comment",
        "accepted",
        "thanks",
        "relay",
        "moderation",
        "system",
        "digest",
      ],
      participant_kind: ["rsvp", "seat", "member"],
      post_audience: ["campus", "meal_holders"],
      post_status: ["active", "resolved", "expired", "removed", "deleted"],
      post_type: [
        "question",
        "notice",
        "event",
        "listing",
        "meal",
        "lost",
        "found",
        "ride",
        "study",
        "roommate",
        "poll",
      ],
      reaction_kind: ["thanks"],
      reaction_target: ["post", "comment"],
      relay_state: ["open", "closed", "completed"],
      report_category: [
        "harassment",
        "stalking",
        "scam",
        "impersonation",
        "hate",
        "sexual",
        "meal_resale",
        "prohibited_item",
        "spam",
        "other",
      ],
      report_status: ["open", "in_review", "actioned", "dismissed"],
      report_target: ["post", "comment", "thread", "profile"],
      space_kind: ["general", "course", "residence", "club", "interest"],
      space_role: ["member", "organizer"],
      university_status: ["pending", "active", "paused"],
    },
  },
} as const

