import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Squad, SquadMemberWithStats } from '../types';
import { startOfYear, format } from 'date-fns';

interface SquadsState {
  currentSquad: Squad | null;
  members: SquadMemberWithStats[];
  loading: boolean;
  fetchMySquad: (userId: string) => Promise<void>;
  createSquad: (userId: string, name: string) => Promise<{ squad: Squad | null; error: Error | null }>;
  joinSquad: (userId: string, inviteCode: string) => Promise<{ error: Error | null }>;
  leaveSquad: (userId: string) => Promise<{ error: Error | null }>;
  fetchMembers: (squadId: string) => Promise<void>;
}

export const useSquadsStore = create<SquadsState>((set, get) => ({
  currentSquad: null,
  members: [],
  loading: false,

  fetchMySquad: async (userId) => {
    set({ loading: true });
    
    const { data: membership, error } = await supabase
      .from('squad_members')
      .select('squad_id')
      .eq('user_id', userId)
      .single();

    if (error || !membership) {
      set({ currentSquad: null, members: [], loading: false });
      return;
    }

    const { data: squad } = await supabase
      .from('squads')
      .select('*')
      .eq('id', membership.squad_id)
      .single();

    if (squad) {
      set({ currentSquad: squad as Squad });
      await get().fetchMembers(squad.id);
    }
    set({ loading: false });
  },

  createSquad: async (userId, name) => {
    const { data: squad, error } = await supabase
      .from('squads')
      .insert({
        name,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !squad) {
      return { squad: null, error };
    }

    await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: userId,
      });

    set({ currentSquad: squad as Squad });
    await get().fetchMembers(squad.id);
    
    return { squad: squad as Squad, error: null };
  },

  joinSquad: async (userId, inviteCode) => {
    const { data: squad, error: findError } = await supabase
      .from('squads')
      .select('*')
      .eq('invite_code', inviteCode.toLowerCase())
      .single();

    if (findError || !squad) {
      return { error: new Error('Invalid invite code') };
    }

    const { data: existingMembers, error: countError } = await supabase
      .from('squad_members')
      .select('user_id')
      .eq('squad_id', squad.id);

    if (countError || (existingMembers?.length ?? 0) >= 4) {
      return { error: new Error('Squad is full (max 4 members)') };
    }

    const { error: joinError } = await supabase
      .from('squad_members')
      .insert({
        squad_id: squad.id,
        user_id: userId,
      });

    if (joinError) {
      return { error: joinError };
    }

    set({ currentSquad: squad as Squad });
    await get().fetchMembers(squad.id);

    return { error: null };
  },

  leaveSquad: async (userId) => {
    const { currentSquad } = get();
    if (!currentSquad) return { error: new Error('Not in a squad') };

    const { error } = await supabase
      .from('squad_members')
      .delete()
      .eq('squad_id', currentSquad.id)
      .eq('user_id', userId);

    if (!error) {
      set({ currentSquad: null, members: [] });
    }

    return { error };
  },

  fetchMembers: async (squadId) => {
    const yearStart = format(startOfYear(new Date()), 'yyyy-MM-dd');

    const { data: members } = await supabase
      .from('squad_members')
      .select(`
        squad_id,
        user_id,
        joined_at,
        profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('squad_id', squadId);

    if (!members) {
      set({ members: [] });
      return;
    }

    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const { count } = await supabase
          .from('entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', member.user_id)
          .gte('date', yearStart);

        return {
          ...member,
          total_entries: count ?? 0,
        } as SquadMemberWithStats;
      })
    );

    const sorted = membersWithStats.sort((a, b) => b.total_entries - a.total_entries);
    set({ members: sorted });
  },
}));
