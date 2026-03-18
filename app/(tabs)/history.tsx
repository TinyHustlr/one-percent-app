import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useEntriesStore } from '../../store/entriesStore';
import { useThemeStore } from '../../store/themeStore';
import type { Entry } from '../../types';

export default function HistoryScreen() {
  const { entries, loading } = useEntriesStore();
  const { theme } = useThemeStore();

  const renderEntry = ({ item }: { item: Entry }) => (
    <View style={[styles.entryCard, { backgroundColor: theme.white }]}>
      <View style={styles.entryHeader}>
        <Text style={[styles.entryDate, { color: theme.gray }]}>
          {format(parseISO(item.date), 'EEEE, MMM d')}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.categoryText, { color: theme.primary }]}>
            {item.category === 'custom' ? item.custom_category : item.category}
          </Text>
        </View>
      </View>
      <Text style={[styles.entryContent, { color: theme.dark }]}>{item.content}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.dark }]}>History</Text>
      <Text style={[styles.subtitle, { color: theme.gray }]}>Your journey to 1% better</Text>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.dark }]}>No entries yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.gray }]}>
            Start by making your first entry on the Today tab
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  entryCard: {
    borderRadius: 16,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  entryContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
