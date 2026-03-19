import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Entry, Category, CategoryStats } from '../types';
import { startOfYear, format } from 'date-fns';

interface EntriesState {
  entries: Entry[];
  todayEntry: Entry | null;
  loading: boolean;
  fetchEntries: (userId: string) => Promise<void>;
  fetchTodayEntry: (userId: string) => Promise<void>;
  createEntry: (userId: string, category: Category, customCategory: string | null, content: string) => Promise<{ error: Error | null }>;
  updateEntry: (entryId: string, content: string, category?: Category, customCategory?: string | null) => Promise<{ error: Error | null }>;
  deleteEntry: (entryId: string, userId: string) => Promise<{ error: Error | null }>;
  getCategoryStats: () => CategoryStats[];
}

const CATEGORIES: Category[] = ['health', 'fitness', 'work', 'education', 'custom'];

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  todayEntry: null,
  loading: false,

  fetchEntries: async (userId) => {
    set({ loading: true });
    const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', yearStart)
      .order('date', { ascending: false });

    if (!error && data) {
      set({ entries: data as Entry[], loading: false });
    } else {
      set({ loading: false });
    }
  },

  fetchTodayEntry: async (userId) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (!error && data) {
      set({ todayEntry: data as Entry });
    } else {
      set({ todayEntry: null });
    }
  },

  createEntry: async (userId, category, customCategory, content) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { error } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        date: today,
        category,
        custom_category: category === 'custom' ? customCategory : null,
        content,
      });

    if (!error) {
      await get().fetchEntries(userId);
      await get().fetchTodayEntry(userId);
    }

    return { error };
  },

  updateEntry: async (entryId, content, category, customCategory) => {
    const updates: Partial<Entry> = { content };
    
    if (category) {
      updates.category = category;
      updates.custom_category = category === 'custom' ? customCategory : null;
    }

    const { error } = await supabase
      .from('entries')
      .update(updates)
      .eq('id', entryId);

    if (!error) {
      const { entries } = get();
      const updatedEntries = entries.map(e => 
        e.id === entryId ? { ...e, ...updates } : e
      );
      set({ entries: updatedEntries });
    }

    return { error };
  },

  deleteEntry: async (entryId, userId) => {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId);

    if (!error) {
      const { entries } = get();
      set({ entries: entries.filter(e => e.id !== entryId) });
      await get().fetchTodayEntry(userId);
    }

    return { error };
  },

  getCategoryStats: () => {
    const { entries } = get();
    const stats: CategoryStats[] = CATEGORIES.map(category => {
      const categoryEntries = entries.filter(e => e.category === category);
      const count = categoryEntries.length;
      return {
        category,
        custom_category: categoryEntries[0]?.custom_category ?? undefined,
        count,
        percentage: count,
      };
    });
    return stats;
  },
}));
