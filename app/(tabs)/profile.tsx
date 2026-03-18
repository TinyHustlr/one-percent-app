import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useEntriesStore } from '../../store/entriesStore';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabase';
import { themes, ThemeName } from '../../lib/constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { entries } = useEntriesStore();
  const { theme, themeName, setTheme } = useThemeStore();
  
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
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

  const handleThemeChange = async (name: ThemeName) => {
    await setTheme(name);
    setShowThemeModal(false);
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.dark }]}>Profile</Text>

      <View style={[styles.profileCard, { backgroundColor: theme.white }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.avatarText, { color: theme.name === 'hustler' ? '#000' : '#fff' }]}>
            {nickname ? nickname.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.nickname, { color: theme.dark }]}>{nickname || 'No nickname'}</Text>
        <Text style={[styles.email, { color: theme.gray }]}>{user?.email}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setShowNicknameModal(true)}
        >
          <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit Nickname</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsCard, { backgroundColor: theme.white }]}>
        <Text style={[styles.statsTitle, { color: theme.dark }]}>This Year's Stats</Text>
        <View style={[styles.statRow, { borderBottomColor: theme.lightGray }]}>
          <Text style={[styles.statLabel, { color: theme.gray }]}>Total Entries</Text>
          <Text style={[styles.statValue, { color: theme.primary }]}>{entries.length}</Text>
        </View>
        <View style={[styles.statRow, { borderBottomColor: theme.lightGray }]}>
          <Text style={[styles.statLabel, { color: theme.gray }]}>Progress</Text>
          <Text style={[styles.statValue, { color: theme.primary }]}>{entries.length}%</Text>
        </View>
      </View>

      <View style={[styles.statsCard, { backgroundColor: theme.white }]}>
        <Text style={[styles.statsTitle, { color: theme.dark }]}>Appearance</Text>
        <TouchableOpacity 
          style={[styles.themeRow, { borderBottomColor: theme.lightGray }]}
          onPress={() => setShowThemeModal(true)}
        >
          <Text style={[styles.statLabel, { color: theme.gray }]}>Theme</Text>
          <View style={styles.themeValue}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{themes[themeName].displayName}</Text>
            <Text style={{ color: theme.gray }}> →</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.white }]}>
        <Text style={[styles.infoTitle, { color: theme.dark }]}>About 1% Better</Text>
        <Text style={[styles.infoText, { color: theme.gray }]}>
          The concept is simple: get just 1% better every day. 
          After one year, you'll be 365% better than when you started.
        </Text>
        <Text style={[styles.infoText, { color: theme.gray }]}>
          Built with React Native + Supabase
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.signOutButton, { backgroundColor: theme.danger + '20' }]} 
        onPress={handleSignOut}
      >
        <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
      </TouchableOpacity>

      {/* Nickname Modal */}
      <Modal visible={showNicknameModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
            <Text style={[styles.modalTitle, { color: theme.dark }]}>Set Nickname</Text>
            <Text style={[styles.modalSubtitle, { color: theme.gray }]}>
              This is how you'll appear to your squad
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.dark }]}
              placeholder="Enter nickname"
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
              placeholderTextColor={theme.gray}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: theme.lightGray }]}
                onPress={() => setShowNicknameModal(false)}
              >
                <Text style={[styles.cancelText, { color: theme.dark }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: theme.primary }]}
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

      {/* Theme Modal */}
      <Modal visible={showThemeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
            <Text style={[styles.modalTitle, { color: theme.dark }]}>Choose Theme</Text>
            <ScrollView style={styles.themeList}>
              {(Object.keys(themes) as ThemeName[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: themeName === key ? theme.primary + '20' : theme.background,
                      borderColor: themeName === key ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={() => handleThemeChange(key)}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.themePreviewBox, { backgroundColor: themes[key].background }]}>
                      <Text style={{ color: themes[key].primary, fontWeight: 'bold' }}>Aa</Text>
                    </View>
                    <View style={[styles.themePreviewBox, { backgroundColor: themes[key].dark }]}>
                      <Text style={{ color: themes[key].primary }}>Aa</Text>
                    </View>
                  </View>
                  <Text style={[styles.themeOptionText, { color: theme.dark }]}>
                    {themes[key].displayName}
                  </Text>
                  {themeName === key && (
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.cancelButton, { marginTop: 16, backgroundColor: theme.lightGray }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={[styles.cancelText, { color: theme.dark }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  nickname: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  themeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  signOutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  signOutText: {
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
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
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  themeList: {
    maxHeight: 300,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  themePreview: {
    flexDirection: 'row',
    marginRight: 12,
  },
  themePreviewBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
