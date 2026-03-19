import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, ScrollView, Switch, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useEntriesStore } from '../../store/entriesStore';
import { useThemeStore } from '../../store/themeStore';
import { useStoreStore } from '../../store/storeStore';
import { useNotificationStore } from '../../store/notificationStore';
import { supabase } from '../../lib/supabase';
import { themes, ThemeName } from '../../lib/constants';

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { entries } = useEntriesStore();
  const { theme, themeName, setTheme } = useThemeStore();
  const { xp, fetchXP } = useStoreStore();
  const { settings, loadSettings, setEnabled, setReminderTime } = useNotificationStore();
  const router = useRouter();
  
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchNickname();
    if (user) {
      fetchXP(user.id);
      loadSettings();
    }
  }, [user]);

  const handleNotificationToggle = async (value: boolean) => {
    await setEnabled(value);
  };

  const handleTimeSelect = async (time: string) => {
    await setReminderTime(time);
    setShowTimeModal(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This will permanently delete your account and ALL your data. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete My Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '⚠️ Final Warning',
              'This will permanently delete:\n\n• All your entries\n• Your squad membership\n• Your profile\n• All XP and progress\n\nType DELETE to confirm:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Everything', 
                  style: 'destructive',
                  onPress: async () => {
                    if (!user) return;
                    
                    setLoading(true);
                    try {
                      await supabase.from('entries').delete().eq('user_id', user.id);
                      await supabase.from('squad_members').delete().eq('user_id', user.id);
                      await supabase.from('profiles').delete().eq('id', user.id);
                      await supabase.from('weekly_purchases').delete().eq('user_id', user.id);
                      await supabase.from('store_transactions').delete().eq('user_id', user.id);
                      
                      await supabase.auth.admin.deleteUser(user.id);
                      
                      await signOut();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                      setLoading(false);
                    }
                  }
                },
              ]
            );
          }
        },
      ]
    );
  };

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

  const handleGoToStore = () => {
    router.push('/(tabs)/store');
  };
  
  const calculateStreak = () => {
    if (entries.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasEntry = sortedEntries.some(e => e.date === dateStr);
      if (hasEntry) streak++;
      else if (i > 0) break;
    }
    return streak;
  };
  
  const streak = calculateStreak();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={[styles.avatarRing, { borderColor: theme.primary }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: '#fff' }]}>
              {nickname ? nickname.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
        <Text style={styles.nickname}>{nickname || 'Set your nickname'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowNicknameModal(true)}
          >
            <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit Nickname</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.storeButton}
            onPress={handleGoToStore}
          >
            <Text style={styles.storeButtonIcon}>⚡</Text>
            <Text style={styles.storeButtonText}>XP Store</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{entries.length}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
          <Text style={styles.statIcon}>📝</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
          <Text style={styles.statIcon}>🔥</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{xp}</Text>
          <Text style={styles.statLabel}>XP Earned</Text>
          <Text style={styles.statIcon}>⚡</Text>
        </View>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => setShowThemeModal(true)}
        >
          <Text style={styles.themeIcon}>🎨</Text>
          <Text style={styles.statLabel}>Theme</Text>
          <Text style={[styles.themeName, { color: theme.primary }]}>{themes[themeName].displayName}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notificationCard}>
        <Text style={styles.notificationTitle}>📱 Reminders</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Reminder</Text>
            <Text style={styles.settingDescription}>Get notified to make your daily entry</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#334155', true: '#6366F1' }}
            thumbColor={settings.enabled ? '#fff' : '#94A3B8'}
          />
        </View>

        {settings.enabled && (
          <TouchableOpacity 
            style={styles.timeRow}
            onPress={() => setShowTimeModal(true)}
          >
            <Text style={styles.settingLabel}>Reminder Time</Text>
            <View style={styles.timeValue}>
              <Text style={styles.timeText}>{formatTime(settings.reminderTime)}</Text>
              <Text style={styles.timeArrow}>›</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>About 1% Better</Text>
        <Text style={styles.aboutText}>
          The concept is simple: get just 1% better every day. 
        </Text>
        <Text style={styles.aboutText}>
          After one year, you'll be 37x better than when you started.
        </Text>
        <View style={styles.techBadge}>
          <Text style={styles.techText}>Built with React Native + Supabase</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.deleteAccountButton}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.deleteAccountText}>Delete Account</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      <Modal visible={showNicknameModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.dark }]}>Set Nickname</Text>
            <Text style={[styles.modalSubtitle, { color: theme.gray }]}>
              This is how you'll appear to your squad
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.dark, borderColor: theme.border }]}
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

      <Modal visible={showThemeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.dark }]}>Choose Theme</Text>
            <ScrollView style={styles.themeList}>
              {(Object.keys(themes) as ThemeName[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: themeName === key ? themes[key].primary + '20' : theme.background,
                      borderColor: themeName === key ? themes[key].primary : theme.border,
                    }
                  ]}
                  onPress={() => handleThemeChange(key)}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.themePreviewBox, { backgroundColor: themes[key].background }]}>
                      <Text style={{ color: themes[key].primary, fontWeight: 'bold' }}>Aa</Text>
                    </View>
                    <View style={[styles.themePreviewBox, { backgroundColor: themes[key].card }]}>
                      <Text style={{ color: themes[key].primary }}>Aa</Text>
                    </View>
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeOptionText, { color: theme.dark }]}>
                      {themes[key].displayName}
                    </Text>
                    {themeName === key && (
                      <Text style={{ color: themes[key].primary, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </View>
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

      <Modal visible={showTimeModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.dark }]}>Choose Time</Text>
            <ScrollView style={styles.timeList}>
              {[
                '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
                '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
              ].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    settings.reminderTime === time && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
                  ]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text style={[styles.timeOptionText, { color: theme.dark }]}>
                    {formatTime(time)}
                  </Text>
                  {settings.reminderTime === time && (
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.cancelButton, { marginTop: 16, backgroundColor: theme.lightGray }]}
              onPress={() => setShowTimeModal(false)}
            >
              <Text style={[styles.cancelText, { color: theme.dark }]}>Cancel</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  xpBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  xpText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  storeButtonIcon: {
    fontSize: 14,
  },
  storeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  statIcon: {
    fontSize: 24,
    marginTop: 8,
  },
  themeIcon: {
    fontSize: 28,
    marginTop: 8,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  notificationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#94A3B8',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 12,
  },
  timeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  timeArrow: {
    fontSize: 20,
    color: '#94A3B8',
    marginLeft: 8,
  },
  timeList: {
    maxHeight: 300,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  aboutCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 4,
  },
  techBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  techText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  signOutButton: {
    backgroundColor: '#EF444420',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteAccountButton: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteAccountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  themeInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
