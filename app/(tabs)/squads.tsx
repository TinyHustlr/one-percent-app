import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Share, Modal, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useSquadsStore } from '../../store/squadsStore';
import { useEntriesStore } from '../../store/entriesStore';
import { colors } from '../../lib/constants';

const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function SquadsScreen() {
  const { user } = useAuthStore();
  const { currentSquad, members, createSquad, joinSquad, leaveSquad, fetchMembers } = useSquadsStore();
  const { entries } = useEntriesStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentSquad) {
      const interval = setInterval(() => {
        fetchMembers(currentSquad.id);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentSquad?.id]);

  const handleCreateSquad = async () => {
    if (!squadName.trim()) {
      Alert.alert('Error', 'Please enter a squad name');
      return;
    }

    if (currentSquad) {
      Alert.alert(
        'Leave Current Squad?',
        `You're already in "${currentSquad.name}". Creating a new squad will automatically leave this one. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Create New Squad', 
            onPress: async () => {
              setLoading(true);
              const { error } = await createSquad(user!.id, squadName);
              if (error) {
                Alert.alert('Error', error.message);
              } else {
                setShowCreateModal(false);
                setSquadName('');
              }
              setLoading(false);
            }
          },
        ]
      );
      return;
    }

    setLoading(true);
    const { error } = await createSquad(user!.id, squadName);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowCreateModal(false);
      setSquadName('');
    }
    setLoading(false);
  };

  const handleJoinSquad = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    if (currentSquad) {
      Alert.alert(
        'Leave Current Squad?',
        `You're already in "${currentSquad.name}". Joining a new squad will automatically leave this one. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join New Squad', 
            onPress: async () => {
              setLoading(true);
              const { error } = await joinSquad(user!.id, inviteCode);
              if (error) {
                Alert.alert('Error', error.message);
              } else {
                setShowJoinModal(false);
                setInviteCode('');
              }
              setLoading(false);
            }
          },
        ]
      );
      return;
    }

    setLoading(true);
    const { error } = await joinSquad(user!.id, inviteCode);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowJoinModal(false);
      setInviteCode('');
    }
    setLoading(false);
  };

  const handleLeaveSquad = () => {
    Alert.alert(
      'Leave Squad',
      'Are you sure you want to leave this squad?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await leaveSquad(user!.id);
            if (error) {
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
  };

  const handleShareInvite = async () => {
    if (!currentSquad) return;
    
    try {
      await Share.share({
        message: `Join my 1% Better squad! Use code: ${currentSquad.invite_code}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return { backgroundColor: '#FFD700' + '30', borderColor: '#FFD700' };
    if (index === 1) return { backgroundColor: '#C0C0C0' + '30', borderColor: '#C0C0C0' };
    if (index === 2) return { backgroundColor: '#CD7F32' + '30', borderColor: '#CD7F32' };
    return { backgroundColor: colors.card, borderColor: colors.border };
  };

  const renderMember = ({ item, index }: { item: typeof members[0]; index: number }) => {
    const isCurrentUser = item.user_id === user?.id;
    const rankStyle = getRankStyle(index);
    
    return (
      <View style={[styles.memberCard, rankStyle]}>
        <View style={styles.rankContainer}>
          {index < 3 ? (
            <Text style={styles.rankEmoji}>{RANK_EMOJIS[index]}</Text>
          ) : (
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
          )}
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName}>
              {item.profiles?.username || item.profiles?.full_name || 'Unknown'}
            </Text>
            {isCurrentUser && <View style={styles.youBadge}><Text style={styles.youText}>YOU</Text></View>}
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((item.total_entries / 365) * 100, 100)}%` }]} />
            </View>
            <Text style={styles.memberXP}>{item.total_entries} XP</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!currentSquad) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Squad</Text>
          <Text style={styles.subtitle}>Team up. Get better. Together.</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Squad Yet</Text>
            <Text style={styles.emptyText}>
              Create a squad to compete with your friends or join an existing one
            </Text>
            
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.primaryButtonText}>Create Squad</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
              onPress={() => setShowJoinModal(true)}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Join Squad</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.white }]}>Create Squad</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.white, borderColor: colors.border }]}
                placeholder="Squad name"
                placeholderTextColor={colors.gray}
                value={squadName}
                onChangeText={setSquadName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { backgroundColor: colors.lightGray }]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={[styles.cancelText, { color: colors.white }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                  onPress={handleCreateSquad}
                  disabled={loading}
                >
                  <Text style={styles.confirmText}>
                    {loading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showJoinModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.white }]}>Join Squad</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.white, borderColor: colors.border }]}
                placeholder="Enter invite code"
                placeholderTextColor={colors.gray}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="none"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { backgroundColor: colors.lightGray }]}
                  onPress={() => setShowJoinModal(false)}
                >
                  <Text style={[styles.cancelText, { color: colors.white }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                  onPress={handleJoinSquad}
                  disabled={loading}
                >
                  <Text style={styles.confirmText}>
                    {loading ? 'Joining...' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{currentSquad.name}</Text>
        <View style={styles.inviteSection}>
          <View style={styles.inviteBadge}>
            <Text style={styles.inviteLabel}>CODE</Text>
            <Text style={styles.inviteCode}>{currentSquad.invite_code}</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite}>
            <Text style={styles.shareText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.yourStatsCard}>
        <Text style={styles.yourStatsLabel}>Your Progress</Text>
        <View style={styles.yourStatsRow}>
          <Text style={styles.yourStatsValue}>{entries.length}</Text>
          <Text style={styles.yourStatsUnit}>XP</Text>
        </View>
        <View style={styles.progressBarLarge}>
          <View style={[styles.progressFillLarge, { width: `${Math.min((entries.length / 365) * 100, 100)}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={styles.progressLabel}>{entries.length} / 365 days</Text>
      </View>

      <View style={styles.leaderboardSection}>
        <Text style={styles.leaderboardTitle}>Leaderboard</Text>
        <Text style={styles.leaderboardSubtitle}>{members.length} / 4 members</Text>
      </View>
      
      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.leaveButton}
            onPress={handleLeaveSquad}
          >
            <Text style={styles.leaveText}>Leave Squad</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  inviteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  inviteLabel: {
    fontSize: 10,
    color: colors.gray,
    fontWeight: '600',
  },
  inviteCode: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  shareButton: {
    padding: 8,
  },
  shareText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  yourStatsCard: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yourStatsLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 8,
  },
  yourStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  yourStatsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  yourStatsUnit: {
    fontSize: 20,
    color: colors.gray,
    marginLeft: 6,
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
  },
  leaderboardSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  leaderboardSubtitle: {
    fontSize: 12,
    color: colors.gray,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  rankContainer: {
    marginRight: 14,
  },
  rankEmoji: {
    fontSize: 28,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  youBadge: {
    backgroundColor: colors.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  memberXP: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 50,
    textAlign: 'right',
  },
  leaveButton: {
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
  },
  leaveText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
