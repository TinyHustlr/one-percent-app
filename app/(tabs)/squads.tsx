import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Share, Modal } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useSquadsStore } from '../../store/squadsStore';
import { useEntriesStore } from '../../store/entriesStore';
import { colors } from '../../lib/constants';

export default function SquadsScreen() {
  const { user } = useAuthStore();
  const { currentSquad, members, createSquad, joinSquad, leaveSquad, fetchMembers } = useSquadsStore();
  const { entries } = useEntriesStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

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

  const renderMember = ({ item, index }: { item: typeof members[0]; index: number }) => (
    <View style={styles.memberCard}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.profiles?.username || item.profiles?.full_name || 'Unknown'}
          {item.user_id === user?.id && ' (You)'}
        </Text>
        <Text style={styles.memberEntries}>{item.total_entries}% this year</Text>
      </View>
    </View>
  );

  if (!currentSquad) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Squads</Text>
        <Text style={styles.subtitle}>Team up to get 1% better together</Text>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>You're not in a squad yet</Text>
          <Text style={styles.emptyText}>
            Create a squad or join one with an invite code. Max 4 members per squad.
          </Text>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.primaryButtonText}>Create Squad</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.secondaryButtonText}>Join Squad</Text>
          </TouchableOpacity>
        </View>

        {/* Create Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Squad</Text>
              <TextInput
                style={styles.input}
                placeholder="Squad name"
                value={squadName}
                onChangeText={setSquadName}
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
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

        {/* Join Modal */}
        <Modal visible={showJoinModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Join Squad</Text>
              <TextInput
                style={styles.input}
                placeholder="Invite code"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowJoinModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
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
      <Text style={styles.title}>Squad</Text>
      
      <View style={styles.squadHeader}>
        <Text style={styles.squadName}>{currentSquad.name}</Text>
        <View style={styles.inviteRow}>
          <Text style={styles.inviteCode}>{currentSquad.invite_code}</Text>
          <TouchableOpacity onPress={handleShareInvite}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.yourStats}>
        <Text style={styles.yourStatsLabel}>Your Progress This Year</Text>
        <Text style={styles.yourStatsValue}>{entries.length}%</Text>
      </View>

      <Text style={styles.leaderboardTitle}>Leaderboard</Text>
      
      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.leaveButton}
        onPress={handleLeaveSquad}
      >
        <Text style={styles.leaveText}>Leave Squad</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.dark,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  squadHeader: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  squadName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  yourStats: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  yourStatsLabel: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  yourStatsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  memberEntries: {
    fontSize: 14,
    color: colors.gray,
  },
  leaveButton: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  leaveText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.dark,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.lightGray,
  },
  cancelText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  confirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
