import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { StoreItem } from '../types';

interface StoreItemCardProps {
  item: StoreItem;
  canAfford: boolean;
  weeklyLimitHit: boolean;
  onBuy: () => void;
}

export const StoreItemCard = ({ item, canAfford, weeklyLimitHit, onBuy }: StoreItemCardProps) => {
  const disabled = !canAfford || weeklyLimitHit;
  const buttonText = weeklyLimitHit ? 'Used' : !canAfford ? 'Need XP' : 'Buy';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={[styles.costBadge, { backgroundColor: canAfford && !weeklyLimitHit ? '#6366F1' : '#475569' }]}>
          <Text style={styles.costText}>{item.cost} XP</Text>
        </View>
      </View>
      
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      
      <View style={styles.footer}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <TouchableOpacity
          style={[styles.buyButton, disabled && styles.buyButtonDisabled]}
          onPress={onBuy}
          disabled={disabled}
        >
          <Text style={[styles.buyButtonText, disabled && styles.buyButtonTextDisabled]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  costBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  costText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  buyButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#334155',
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  buyButtonTextDisabled: {
    color: '#64748B',
  },
});
