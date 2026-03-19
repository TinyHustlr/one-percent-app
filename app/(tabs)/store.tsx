import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Modal, TouchableOpacity, FlatList } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useStoreStore } from '../../store/storeStore';
import { useSquadsStore } from '../../store/squadsStore';
import { storeItems, getItemsByType } from '../../lib/items';
import { StoreItemCard } from '../../components/StoreItemCard';
import { ConfirmPurchaseModal } from '../../components/ConfirmPurchaseModal';
import type { StoreItem, SquadMemberWithStats } from '../../types';

export default function StoreScreen() {
  const { user } = useAuthStore();
  const { xp, weeklyPurchases, loading, fetchXP, fetchWeeklyPurchases, purchaseItem, giftXPToUser, hasDoubleXP } = useStoreStore();
  const { currentSquad, members, fetchMySquad } = useSquadsStore();
  
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchXP(user.id);
      fetchWeeklyPurchases(user.id);
      fetchMySquad(user.id);
    }
  }, [user]);

  const hasPurchasedThisWeek = (itemId: string) => {
    return weeklyPurchases.some(p => p.item_id === itemId);
  };

  const handleBuy = (item: StoreItem) => {
    if (item.id === 'gift' && !currentSquad) {
      Alert.alert('No Squad', 'You need to be in a squad to gift XP to others');
      return;
    }
    
    if (item.id === 'gift' && currentSquad) {
      setSelectedItem(item);
      setShowGiftModal(true);
    } else {
      setSelectedItem(item);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!user || !selectedItem) return;

    const result = await purchaseItem(user.id, selectedItem.id);

    if (result.success) {
      setShowConfirmModal(false);
      setSelectedItem(null);
      if (selectedItem.id === 'double_xp') {
        Alert.alert('Purchased!', 'Your next entry will earn 20 XP!', [{ text: 'Nice!' }]);
      } else {
        Alert.alert('Purchased!', `You acquired ${selectedItem.name} ${selectedItem.icon}`, [{ text: 'Nice!' }]);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to complete purchase');
    }
  };

  const handleGiftXP = async (targetUserId: string) => {
    if (!user) return;

    setShowGiftModal(false);
    const targetMember = members.find(m => m.user_id === targetUserId);
    
    const result = await giftXPToUser(user.id, targetUserId);

    if (result.success) {
      setSelectedItem(null);
      Alert.alert('Gift Sent!', `You gave 10 XP to ${targetMember?.profiles?.username || 'your squadmate'}!`, [{ text: 'Nice!' }]);
    } else {
      Alert.alert('Error', result.error || 'Failed to send gift');
    }
  };

  const renderMember = ({ item }: { item: SquadMemberWithStats }) => (
    <TouchableOpacity 
      style={styles.memberCard}
      onPress={() => handleGiftXP(item.user_id)}
    >
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {item.profiles?.username?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.profiles?.username || 'Unknown'}
        </Text>
        <Text style={styles.memberEntries}>{item.total_entries} entries</Text>
      </View>
      <View style={styles.giftButton}>
        <Text style={styles.giftButtonText}>Gift 10 XP</Text>
      </View>
    </TouchableOpacity>
  );

  const personalItems = getItemsByType('personal');
  const squadItems = getItemsByType('squad');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>XP Store</Text>
        <View style={styles.xpBadge}>
          <Text style={styles.xpIcon}>⚡</Text>
          <Text style={styles.xpAmount}>{xp}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>

      {hasDoubleXP && (
        <View style={styles.activeBuffCard}>
          <Text style={styles.activeBuffIcon}>🎯</Text>
          <View style={styles.activeBuffInfo}>
            <Text style={styles.activeBuffTitle}>Double XP Active!</Text>
            <Text style={styles.activeBuffText}>Your next entry earns 20 XP</Text>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Spend your XP on powerups! Each item can be purchased once per week.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎯</Text>
          <Text style={styles.sectionTitle}>Personal</Text>
        </View>
        {personalItems.map(item => (
          <StoreItemCard
            key={item.id}
            item={item}
            canAfford={xp >= item.cost}
            weeklyLimitHit={hasPurchasedThisWeek(item.id)}
            onBuy={() => handleBuy(item)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎁</Text>
          <Text style={styles.sectionTitle}>Squad</Text>
        </View>
        {squadItems.map(item => (
          <StoreItemCard
            key={item.id}
            item={item}
            canAfford={xp >= item.cost}
            weeklyLimitHit={hasPurchasedThisWeek(item.id)}
            onBuy={() => handleBuy(item)}
          />
        ))}
        {!currentSquad && (
          <Text style={styles.noSquadText}>Join a squad to unlock Gift XP!</Text>
        )}
      </View>

      <View style={{ height: 40 }} />

      <ConfirmPurchaseModal
        visible={showConfirmModal}
        item={selectedItem}
        userXP={xp}
        onConfirm={handleConfirmPurchase}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedItem(null);
        }}
        loading={loading}
      />

      <Modal visible={showGiftModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.giftModal}>
            <View style={styles.giftModalHeader}>
              <Text style={styles.giftModalTitle}>Gift XP</Text>
              <TouchableOpacity onPress={() => setShowGiftModal(false)}>
                <Text style={styles.giftModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.giftModalSubtitle}>Choose a squadmate to gift XP</Text>
            
            <FlatList
              data={members.filter(m => m.user_id !== user?.id)}
              keyExtractor={(item) => item.user_id}
              renderItem={renderMember}
              style={styles.memberList}
              ListEmptyComponent={
                <Text style={styles.noMembersText}>No other squad members yet</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  xpIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  xpAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 4,
  },
  activeBuffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeBuffIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  activeBuffInfo: {
    flex: 1,
  },
  activeBuffTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  activeBuffText: {
    fontSize: 13,
    color: '#E0E7FF',
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  infoText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  noSquadText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  giftModal: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  giftModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  giftModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  giftModalClose: {
    fontSize: 24,
    color: '#94A3B8',
  },
  giftModalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  memberList: {
    maxHeight: 300,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  memberEntries: {
    fontSize: 13,
    color: '#94A3B8',
  },
  giftButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  giftButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  noMembersText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    padding: 20,
  },
});
