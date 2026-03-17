import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useEntriesStore } from '../../store/entriesStore';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { entries } = useEntriesStore();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNickname();
  }, []);

  const fetchNickname = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    if (data?.username) {
      setNickname(data.username);
    }
  };

  const handleSaveNickname = async () => {
    if (!user) return;
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: nickname.trim() })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowNicknameModal(false);
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {nickname ? nickname.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.nickname}>{nickname || 'No nickname'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setShowNicknameModal(true)}
        >
          <Text style={styles.editButtonText}>Edit Nickname</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>This Year's Stats</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Entries</Text>
          <Text style={styles.statValue}>{entries.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Progress</Text>
          <Text style={styles.statValue}>{entries.length}%</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About 1% Better</Text>
        <Text style={styles.infoText}>
          The concept is simple: get just 1% better every day. 
          After one year, you'll be 365% better than when you started.
        </Text>
        <Text style={styles.infoText}>
          Built with React Native + Supabase
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Nickname Modal */}
      <Modal visible={showNicknameModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Nickname</Text>
            <Text style={styles.modalSubtitle}>
              This is how you'll appear to your squad
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter nickname"
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowNicknameModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleSaveNickname}
                disabled={loading}
              >
                <Text style={styles.confirmText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  nickname: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 22,
    marginBottom: 8,
  },
  signOutButton: {
    backgroundColor: colors.danger + '15',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray,
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
