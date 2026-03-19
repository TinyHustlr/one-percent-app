import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getItemById, DOUBLE_XP_AMOUNT, GIFT_XP_AMOUNT } from '../lib/items';
import { startOfWeek, format } from 'date-fns';
import type { WeeklyPurchase } from '../types';

interface StoreState {
  xp: number;
  hasDoubleXP: boolean;
  weeklyPurchases: WeeklyPurchase[];
  loading: boolean;
  fetchXP: (userId: string) => Promise<void>;
  fetchWeeklyPurchases: (userId: string) => Promise<void>;
  purchaseItem: (userId: string, itemId: string, targetUserId?: string) => Promise<{ success: boolean; error?: string }>;
  canPurchase: (itemId: string) => boolean;
  addXP: (userId: string, amount: number) => Promise<void>;
  useDoubleXP: () => void;
  awardXPWithDouble: (userId: string) => Promise<number>;
  giftXPToUser: (fromUserId: string, toUserId: string) => Promise<{ success: boolean; error?: string }>;
}

const getWeekStart = (): string => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  return format(weekStart, 'yyyy-MM-dd');
};

export const useStoreStore = create<StoreState>((set, get) => ({
  xp: 0,
  hasDoubleXP: false,
  weeklyPurchases: [],
  loading: false,

  fetchXP: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', userId)
      .single();
    
    if (data) {
      set({ xp: data.xp || 0 });
    }
  },

  fetchWeeklyPurchases: async (userId) => {
    const weekStart = getWeekStart();
    
    const { data } = await supabase
      .from('weekly_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart);
    
    if (data) {
      set({ weeklyPurchases: data as WeeklyPurchase[] });
    }
  },

  canPurchase: (itemId) => {
    const { xp, weeklyPurchases } = get();
    const item = getItemById(itemId);
    
    if (!item) return false;
    if (xp < item.cost) return false;
    
    const weeklyLimitHit = weeklyPurchases.some(p => p.item_id === itemId);
    return !weeklyLimitHit;
  },

  purchaseItem: async (userId, itemId, targetUserId) => {
    const { xp, canPurchase, hasDoubleXP } = get();
    const item = getItemById(itemId);
    
    if (!canPurchase(itemId)) {
      return { success: false, error: 'Cannot purchase this item' };
    }

    set({ loading: true });

    const deductXP = xp - item!.cost;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ xp: deductXP })
      .eq('id', userId);

    if (profileError) {
      set({ loading: false });
      return { success: false, error: profileError.message };
    }

    const weekStart = getWeekStart();
    const { error: purchaseError } = await supabase
      .from('weekly_purchases')
      .insert({
        user_id: userId,
        item_id: itemId,
        week_start: weekStart,
      });

    if (purchaseError) {
      await supabase
        .from('profiles')
        .update({ xp })
        .eq('id', userId);
      set({ loading: false });
      return { success: false, error: purchaseError.message };
    }

    const { error: transactionError } = await supabase
      .from('store_transactions')
      .insert({
        user_id: userId,
        item_id: itemId,
        target_user_id: targetUserId || null,
      });

    if (transactionError) {
      console.error('Transaction log error:', transactionError);
    }

    let newDoubleXP = hasDoubleXP;
    if (itemId === 'double_xp') {
      newDoubleXP = true;
    }

    set({
      xp: deductXP,
      hasDoubleXP: newDoubleXP,
      loading: false,
      weeklyPurchases: [...get().weeklyPurchases, { user_id: userId, item_id: itemId, week_start: weekStart }],
    });

    return { success: true };
  },

  useDoubleXP: () => {
    set({ hasDoubleXP: false });
  },

  awardXPWithDouble: async (userId) => {
    const { hasDoubleXP, addXP, useDoubleXP } = get();
    const amount = hasDoubleXP ? DOUBLE_XP_AMOUNT : 10;
    
    await addXP(userId, amount);
    
    if (hasDoubleXP) {
      useDoubleXP();
    }
    
    return amount;
  },

  giftXPToUser: async (fromUserId, toUserId) => {
    const { xp, canPurchase } = get();
    
    if (!canPurchase('gift')) {
      return { success: false, error: 'Cannot gift XP' };
    }

    set({ loading: true });

    const deductXP = xp - GIFT_XP_AMOUNT;

    const { error: fromError } = await supabase
      .from('profiles')
      .update({ xp: deductXP })
      .eq('id', fromUserId);

    if (fromError) {
      set({ loading: false });
      return { success: false, error: fromError.message };
    }

    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', toUserId)
      .single();

    const newTargetXP = (targetProfile?.xp || 0) + GIFT_XP_AMOUNT;

    const { error: toError } = await supabase
      .from('profiles')
      .update({ xp: newTargetXP })
      .eq('id', toUserId);

    if (toError) {
      await supabase
        .from('profiles')
        .update({ xp })
        .eq('id', fromUserId);
      set({ loading: false });
      return { success: false, error: toError.message };
    }

    const weekStart = getWeekStart();
    await supabase
      .from('weekly_purchases')
      .insert({
        user_id: fromUserId,
        item_id: 'gift',
        week_start: weekStart,
      });

    await supabase
      .from('store_transactions')
      .insert({
        user_id: fromUserId,
        item_id: 'gift',
        target_user_id: toUserId,
      });

    set({
      xp: deductXP,
      loading: false,
      weeklyPurchases: [...get().weeklyPurchases, { user_id: fromUserId, item_id: 'gift', week_start: weekStart }],
    });

    return { success: true };
  },

  addXP: async (userId, amount) => {
    const { xp } = get();
    const newXP = xp + amount;

    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXP })
      .eq('id', userId);

    if (!error) {
      set({ xp: newXP });
    }
  },
}));
