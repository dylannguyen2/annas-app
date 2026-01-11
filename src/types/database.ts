export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          timezone: string
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          timezone?: string
          stripe_customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          timezone?: string
          stripe_customer_id?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          stripe_customer_id: string
          status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          stripe_customer_id: string
          status: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string
          stripe_customer_id?: string
          status?: 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          trial_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      garmin_credentials: {
        Row: {
          id: string
          user_id: string
          oauth1_token: Json | null
          oauth2_token: Json | null
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          oauth1_token?: Json | null
          oauth2_token?: Json | null
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          oauth1_token?: Json | null
          oauth2_token?: Json | null
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string
          color: string
          frequency: string
          target_per_week: number
          archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string
          color?: string
          frequency?: string
          target_per_week?: number
          archived?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string
          color?: string
          frequency?: string
          target_per_week?: number
          archived?: boolean
          created_at?: string
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          date: string
          completed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          date: string
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          date?: string
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      moods: {
        Row: {
          id: string
          user_id: string
          date: string
          mood: number | null
          energy: number | null
          stress: number | null
          notes: string | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          mood?: number | null
          energy?: number | null
          stress?: number | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          mood?: number | null
          energy?: number | null
          stress?: number | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string
        }
      }
      health_data: {
        Row: {
          id: string
          user_id: string
          date: string
          sleep_start: string | null
          sleep_end: string | null
          sleep_duration_seconds: number | null
          deep_sleep_seconds: number | null
          light_sleep_seconds: number | null
          rem_sleep_seconds: number | null
          awake_seconds: number | null
          steps: number | null
          distance_meters: number | null
          active_calories: number | null
          total_calories: number | null
          floors_climbed: number | null
          resting_heart_rate: number | null
          min_heart_rate: number | null
          max_heart_rate: number | null
          avg_heart_rate: number | null
          avg_stress_level: number | null
          raw_sleep_data: Json | null
          raw_heart_data: Json | null
          synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          sleep_start?: string | null
          sleep_end?: string | null
          sleep_duration_seconds?: number | null
          deep_sleep_seconds?: number | null
          light_sleep_seconds?: number | null
          rem_sleep_seconds?: number | null
          awake_seconds?: number | null
          steps?: number | null
          distance_meters?: number | null
          active_calories?: number | null
          total_calories?: number | null
          floors_climbed?: number | null
          resting_heart_rate?: number | null
          min_heart_rate?: number | null
          max_heart_rate?: number | null
          avg_heart_rate?: number | null
          avg_stress_level?: number | null
          raw_sleep_data?: Json | null
          raw_heart_data?: Json | null
          synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          sleep_start?: string | null
          sleep_end?: string | null
          sleep_duration_seconds?: number | null
          deep_sleep_seconds?: number | null
          light_sleep_seconds?: number | null
          rem_sleep_seconds?: number | null
          awake_seconds?: number | null
          steps?: number | null
          distance_meters?: number | null
          active_calories?: number | null
          total_calories?: number | null
          floors_climbed?: number | null
          resting_heart_rate?: number | null
          min_heart_rate?: number | null
          max_heart_rate?: number | null
          avg_heart_rate?: number | null
          avg_stress_level?: number | null
          raw_sleep_data?: Json | null
          raw_heart_data?: Json | null
          synced_at?: string
          created_at?: string
        }
      }
      daily_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          journal: string | null
          gratitude: string[] | null
          highlights: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          journal?: string | null
          gratitude?: string[] | null
          highlights?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          journal?: string | null
          gratitude?: string[] | null
          highlights?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          photo_url: string | null
          photo_urls: string[]
          description: string | null
          location: string | null
          notes: string | null
          pinned: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          photo_url?: string | null
          photo_urls?: string[]
          description?: string | null
          location?: string | null
          notes?: string | null
          pinned?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          photo_url?: string | null
          photo_urls?: string[]
          description?: string | null
          location?: string | null
          notes?: string | null
          pinned?: boolean
          created_at?: string
        }
      }
      books: {
        Row: {
          id: string
          user_id: string
          open_library_key: string | null
          title: string
          author: string | null
          cover_url: string | null
          isbn: string | null
          page_count: number | null
          status: 'want_to_read' | 'reading' | 'finished'
          rating: number | null
          notes: string | null
          started_at: string | null
          finished_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          open_library_key?: string | null
          title: string
          author?: string | null
          cover_url?: string | null
          isbn?: string | null
          page_count?: number | null
          status?: 'want_to_read' | 'reading' | 'finished'
          rating?: number | null
          notes?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          open_library_key?: string | null
          title?: string
          author?: string | null
          cover_url?: string | null
          isbn?: string | null
          page_count?: number | null
          status?: 'want_to_read' | 'reading' | 'finished'
          rating?: number | null
          notes?: string | null
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          quadrant: 'do_first' | 'schedule' | 'delegate' | 'eliminate'
          completed: boolean
          due_date: string | null
          completed_at: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          quadrant: 'do_first' | 'schedule' | 'delegate' | 'eliminate'
          completed?: boolean
          due_date?: string | null
          completed_at?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          quadrant?: 'do_first' | 'schedule' | 'delegate' | 'eliminate'
          completed?: boolean
          due_date?: string | null
          completed_at?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          garmin_activity_id: number
          activity_name: string | null
          activity_type: string | null
          activity_type_id: number | null
          start_time: string | null
          duration_seconds: number | null
          moving_duration_seconds: number | null
          elapsed_duration_seconds: number | null
          distance_meters: number | null
          calories: number | null
          avg_heart_rate: number | null
          max_heart_rate: number | null
          avg_speed: number | null
          max_speed: number | null
          elevation_gain: number | null
          elevation_loss: number | null
          steps: number | null
          avg_cadence: number | null
          max_cadence: number | null
          avg_power: number | null
          max_power: number | null
          total_sets: number | null
          total_reps: number | null
          location_name: string | null
          start_latitude: number | null
          start_longitude: number | null
          has_polyline: boolean
          favorite: boolean
          raw_data: Json | null
          synced_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          garmin_activity_id: number
          activity_name?: string | null
          activity_type?: string | null
          activity_type_id?: number | null
          start_time?: string | null
          duration_seconds?: number | null
          moving_duration_seconds?: number | null
          elapsed_duration_seconds?: number | null
          distance_meters?: number | null
          calories?: number | null
          avg_heart_rate?: number | null
          max_heart_rate?: number | null
          avg_speed?: number | null
          max_speed?: number | null
          elevation_gain?: number | null
          elevation_loss?: number | null
          steps?: number | null
          avg_cadence?: number | null
          max_cadence?: number | null
          avg_power?: number | null
          max_power?: number | null
          total_sets?: number | null
          total_reps?: number | null
          location_name?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          has_polyline?: boolean
          favorite?: boolean
          raw_data?: Json | null
          synced_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          garmin_activity_id?: number
          activity_name?: string | null
          activity_type?: string | null
          activity_type_id?: number | null
          start_time?: string | null
          duration_seconds?: number | null
          moving_duration_seconds?: number | null
          elapsed_duration_seconds?: number | null
          distance_meters?: number | null
          calories?: number | null
          avg_heart_rate?: number | null
          max_heart_rate?: number | null
          avg_speed?: number | null
          max_speed?: number | null
          elevation_gain?: number | null
          elevation_loss?: number | null
          steps?: number | null
          avg_cadence?: number | null
          max_cadence?: number | null
          avg_power?: number | null
          max_power?: number | null
          total_sets?: number | null
          total_reps?: number | null
          location_name?: string | null
          start_latitude?: number | null
          start_longitude?: number | null
          has_polyline?: boolean
          favorite?: boolean
          raw_data?: Json | null
          synced_at?: string
          created_at?: string
        }
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
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type Habit = Tables<'habits'>
export type HabitCompletion = Tables<'habit_completions'>
export type Mood = Tables<'moods'>
export type HealthData = Tables<'health_data'>
export type DailyEntry = Tables<'daily_entries'>
export type GarminCredentials = Tables<'garmin_credentials'>
export type Meal = Tables<'meals'>
export type Activity = Tables<'activities'>
export type Book = Tables<'books'>
export type Todo = Tables<'todos'>
export type Subscription = Tables<'subscriptions'>
export type TodoQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate'
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid' | 'paused'
