import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useEntriesStore } from '../../store/entriesStore';
import { useStoreStore } from '../../store/storeStore';
import { colors, categories } from '../../lib/constants';
import { ProgressRing } from '../../components/ProgressRing';
import type { Category } from '../../types';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { todayEntry, entries, createEntry, getCategoryStats } = useEntriesStore();
  const { addXP, hasDoubleXP, awardXPWithDouble } = useStoreStore();
  
  const [selectedCategory, setSelectedCategory] = useState<Category>('health');
  const [customCategory, setCustomCategory] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = getCategoryStats();
  const totalEntries = entries.length;
  const year = new Date().getFullYear();
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  const progressPercent = Math.round((totalEntries / daysInYear) * 100);
  const currentStreak = calculateStreak();

  function calculateStreak() {
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
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Oops!', 'Tell us what you got 1% better at today');
      return;
    }

    if (selectedCategory === 'custom' && !customCategory.trim()) {
      Alert.alert('Oops!', 'Enter a custom category name');
      return;
    }

    if (todayEntry) {
      Alert.alert('Already done!', "Come back tomorrow for another 1%!");
      return;
    }

    setLoading(true);
    const { error } = await createEntry(
      user!.id,
      selectedCategory,
      selectedCategory === 'custom' ? customCategory : null,
      content
    );

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      const xpEarned = await awardXPWithDouble(user!.id);
      const xpMessage = hasDoubleXP ? `+${xpEarned} XP!` : '+10 XP';
      Alert.alert('+1%!', `You're getting better every day! ${xpMessage}`);
      setContent('');
      setCustomCategory('');
    }
    setLoading(false);
  };

  const selectedCat = categories.find(c => c.value === selectedCategory);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Today's Mission</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <ProgressRing 
          progress={Math.min(progressPercent, 100)} 
          size={200}
          strokeWidth={14}
          color={colors.primary}
          label={`${progressPercent}%`}
        />
        {currentStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{currentStreak} day streak!</Text>
          </View>
        )}
        {hasDoubleXP && (
          <View style={[styles.streakBadge, styles.doubleXPBadge]}>
            <Text style={styles.streakIcon}>🎯</Text>
            <Text style={styles.doubleXPText}>Double XP Active!</Text>
          </View>
        )}
      </View>

      {todayEntry ? (
        <View style={styles.completedSection}>
          <View style={styles.completedCard}>
            <View style={styles.completedHeader}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.completedTitle}>Mission Complete!</Text>
            </View>
            <View style={styles.completedContent}>
              <View style={[styles.categoryPill, { backgroundColor: selectedCat?.color + '20' }]}>
                <Text style={styles.categoryIcon}>{selectedCat?.icon}</Text>
                <Text style={[styles.categoryLabel, { color: selectedCat?.color }]}>
                  {todayEntry.category === 'custom' ? todayEntry.custom_category : todayEntry.category}
                </Text>
              </View>
              <Text style={styles.entryText}>{todayEntry.content}</Text>
            </View>
          </View>
          <Text style={styles.tomorrowHint}>See you tomorrow for another 1%!</Text>
        </View>
      ) : (
        <View style={styles.entrySection}>
          <Text style={styles.sectionTitle}>What did you master today?</Text>
          
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  { borderColor: selectedCategory === cat.value ? cat.color : colors.border },
                  selectedCategory === cat.value && { backgroundColor: cat.color + '20', borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategory(cat.value as Category)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text 
                  style={[
                    styles.categoryButtonText,
                    { color: selectedCategory === cat.value ? cat.color : colors.gray }
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCategory === 'custom' && (
            <TextInput
              style={styles.input}
              placeholder="Category name..."
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholderTextColor={colors.gray}
            />
          )}

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Today I got better at..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.gray}
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {loading ? 'Saving...' : 'Complete Mission +1%'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalEntries * 10}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{progressPercent}%</Text>
            <Text style={styles.statLabel}>of Year</Text>
          </View>
        </View>
      </View>

      <View style={styles.categoryBreakdown}>
        <Text style={styles.sectionTitle}>XP by Category</Text>
        {stats.filter(s => s.count > 0).map((stat) => {
          const cat = categories.find(c => c.value === stat.category);
          return (
            <View key={stat.category} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{cat?.icon}</Text>
                <Text style={styles.categoryName}>
                  {stat.category === 'custom' ? (stat.custom_category || 'Custom') : cat?.label}
                </Text>
              </View>
              <View style={styles.categoryProgress}>
                <View style={[styles.categoryBar, { width: `${(stat.count / daysInYear) * 100}%`, backgroundColor: cat?.color }]} />
              </View>
              <Text style={[styles.categoryCount, { color: cat?.color }]}>{stat.count}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
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
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
  },
  date: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  streakIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  streakText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  doubleXPBadge: {
    backgroundColor: '#6366F1',
    marginTop: 8,
  },
  doubleXPText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  completedSection: {
    paddingHorizontal: 20,
  },
  completedCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 24,
    marginRight: 10,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  completedContent: {
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  entryText: {
    fontSize: 16,
    color: colors.white,
    lineHeight: 24,
  },
  tomorrowHint: {
    textAlign: 'center',
    color: colors.gray,
    marginTop: 16,
    fontSize: 14,
  },
  entrySection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: colors.card,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  categoryBreakdown: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  categoryName: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500',
  },
  categoryProgress: {
    flex: 1,
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'right',
  },
});
