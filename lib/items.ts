import { StoreItem, StoreItemType } from '../types';

export const storeItems: StoreItem[] = [
  {
    id: 'double_xp',
    name: 'Double XP',
    icon: '🎯',
    cost: 40,
    type: 'personal',
    description: 'Your next entry earns 20 XP instead of 10',
  },
  {
    id: 'gift',
    name: 'Gift XP',
    icon: '🎁',
    cost: 25,
    type: 'squad',
    description: 'Give 10 XP to a squadmate',
  },
];

export const getItemsByType = (type: StoreItemType): StoreItem[] => {
  return storeItems.filter(item => item.type === type);
};

export const getItemById = (id: string): StoreItem | undefined => {
  return storeItems.find(item => item.id === id);
};

export const DOUBLE_XP_AMOUNT = 20;
export const GIFT_XP_AMOUNT = 10;
export const DOUBLE_XP_COST = 40;
export const GIFT_XP_COST = 25;
