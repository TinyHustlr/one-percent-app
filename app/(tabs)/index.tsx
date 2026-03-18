import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.dark, marginBottom: 4 }}>Today</Text>
      <Text style={{ fontSize: 16, color: colors.gray, marginBottom: 24 }}>What's one thing you got 1% better at?</Text>

      {todayEntry ? (
        <View style={{ backgroundColor: colors.success + '20', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.success, marginBottom: 8 }}>✓ Done for today!</Text>
          <Text style={{ fontSize: 14, color: colors.success, textTransform: 'capitalize', marginBottom: 8 }}>
            {todayEntry.category === 'custom' ? todayEntry.custom_category : todayEntry.category}
          </Text>
          <Text style={{ fontSize: 16, color: colors.dark }}>{todayEntry.content}</Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.dark, marginBottom: 8 }}>Category</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === cat.value ? colors.primary : colors.white,
                  borderWidth: 1,
                  borderColor: selectedCategory === cat.value ? colors.primary : colors.lightGray,
                }}
                onPress={() => setSelectedCategory(cat.value as Category)}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: selectedCategory === cat.value ? colors.white : colors.dark,
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedCategory === 'custom' && (
            <TextInput
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: colors.dark,
                borderWidth: 1,
                borderColor: colors.lightGray,
              }}
              placeholder="Enter custom category"
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholderTextColor={colors.gray}
            />
          )}

          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.dark, marginBottom: 8 }}>What did you improve?</Text>
          <TextInput
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              color: colors.dark,
              borderWidth: 1,
              borderColor: colors.lightGray,
              minHeight: 100,
              textAlignVertical: 'top',
            }}
            placeholder="Today I got better at..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.gray}
          />

          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginTop: 8,
              opacity: loading ? 0.6 : 1,
            }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Saving...' : 'Log 1% Better'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ marginTop: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.dark, marginBottom: 16 }}>Your Progress This Year</Text>
        
        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: colors.primary }}>{totalEntries}%</Text>
          <Text style={{ fontSize: 14, color: colors.gray, marginBottom: 16 }}>of 365% possible</Text>
          <View style={{ width: '100%', height: 8, backgroundColor: colors.lightGray, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: colors.primary, borderRadius: 4 }} />
          </View>
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 16, gap: 12 }}>
          {stats.map((stat) => (
            <View key={stat.category} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: colors.dark, textTransform: 'capitalize' }}>
                {stat.category === 'custom' ? (stat.custom_category || 'Custom') : stat.category}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{stat.count}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
