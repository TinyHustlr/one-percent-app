import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useEntriesStore } from '../../store/entriesStore';
import { colors, categories } from '../../lib/constants';
import type { Category } from '../../types';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { todayEntry, entries, createEntry, getCategoryStats } = useEntriesStore();
  
  const [selectedCategory, setSelectedCategory] = useState<Category>('health');
  const [customCategory, setCustomCategory] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const stats = getCategoryStats();
  const totalEntries = entries.length;
  const maxEntries = 365;
  const progressPercent = Math.round((totalEntries / maxEntries) * 100);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please describe what you improved at today');
      return;
    }

    if (selectedCategory === 'custom' && !customCategory.trim()) {
      Alert.alert('Error', 'Please enter a custom category name');
      return;
    }

    if (todayEntry) {
      Alert.alert('Already done', "You've already made your entry for today. Come back tomorrow!");
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
      Alert.alert('Success', "Great job getting 1% better today!");
      setContent('');
      setCustomCategory('');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.subtitle}>What's one thing you got 1% better at?</Text>

      {todayEntry ? (
        <View style={styles.completedCard}>
          <Text style={styles.completedTitle}>✓ Done for today!</Text>
          <Text style={styles.completedCategory}>
            {todayEntry.category === 'custom' ? todayEntry.custom_category : todayEntry.category}
          </Text>
          <Text style={styles.completedContent}>{todayEntry.content}</Text>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.value && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(cat.value as Category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.value && styles.categoryTextActive,
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
              placeholder="Enter custom category"
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholderTextColor="#999"
            />
          )}

          <Text style={styles.label}>What did you improve?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Today I got better at..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Log 1% Better'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Your Progress This Year</Text>
        
        <View style={styles.progressCard}>
          <Text style={styles.progressNumber}>{totalEntries}%</Text>
          <Text style={styles.progressLabel}>of 365% possible</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        <View style={styles.categoryStats}>
          {stats.map((stat) => (
            <View key={stat.category} style={styles.categoryStatRow}>
              <Text style={styles.categoryStatLabel}>
                {stat.category === 'custom' ? (stat.custom_category || 'Custom') : stat.category}
              </Text>
              <Text style={styles.categoryStatCount}>{stat.count}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.dark,
  },
  categoryTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.dark,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  completedCard: {
    backgroundColor: colors.success + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 8,
  },
  completedCategory: {
    fontSize: 14,
    color: colors.success,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  completedContent: {
    fontSize: 16,
    color: colors.dark,
  },
  statsSection: {
    marginTop: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  progressNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  categoryStats: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  categoryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryStatLabel: {
    fontSize: 14,
    color: colors.dark,
    textTransform: 'capitalize',
  },
  categoryStatCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
