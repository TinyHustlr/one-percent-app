export type Category = 'health' | 'fitness' | 'work' | 'education' | 'custom';

export interface Entry {
  id: string;
  user_id: string;
  date: string;
  category: Category;
  custom_category: string | null;
  content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface CategoryStats {
  category: Category;
  custom_category?: string;
  count: number;
  percentage: number;
}

export interface Squad {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface SquadMember {
  squad_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface SquadMemberWithStats extends SquadMember {
  total_entries: number;
}
