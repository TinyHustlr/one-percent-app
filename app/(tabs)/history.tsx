import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Modal, TouchableOpacity, TextInput } from 'react-native';
import { format, parseISO, isToday, isYesterday, isSameWeek } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useEntriesStore } from '../../store/entriesStore';
import { categories } from '../../lib/constants';
import type { Entry, Category } from '../../types';

const getCategoryInfo = (entry: Entry) => {
  if (entry.category === 'custom') {
    return categories.find(c => c.value === 'custom')!;
  }
  return categories.find(c => c.value === entry.category) || categories[4];
};

const groupEntriesByDate = (entries: Entry[]) => {
  const groups: { title: string; data: Entry[] }[] = [];
  const today: Entry[] = [];
  const yesterday: Entry[] = [];
  const thisWeek: Entry[] = [];
  const older: Entry[] = [];

  entries.forEach(entry => {
    const entryDate = parseISO(entry.date);
    if (isToday(entryDate)) {
      today.push(entry);
    } else if (isYesterday(entryDate)) {
      yesterday.push(entry);
    } else if (isSameWeek(entryDate, new Date())) {
      thisWeek.push(entry);
    } else {
      older.push(entry);
    }
  });

  if (today.length) groups.push({ title: 'Today', data: today });
  if (yesterday.length) groups.push({ title: 'Yesterday', data: yesterday });
  if (thisWeek.length) groups.push({ title: 'This Week', data: thisWeek });
  if (older.length) groups.push({ title: 'Older', data: older });

  return groups;
};

interface EntryCardProps {
  entry: Entry;
  onLongPress: () => void;
}

const EntryCard = ({ entry, onLongPress }: EntryCardProps) => {
  const category = getCategoryInfo(entry);

  return (
    <TouchableOpacity style={styles.entryCard} onLongPress={onLongPress} delayLongPress={500}>
      <View style={[styles.categoryIndicator, { backgroundColor: category.color }]} />
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[styles.categoryText, { color: category.color }]}>
              {entry.category === 'custom' ? (entry.custom_category || 'Custom') : category.label}
            </Text>
          </View>
          <Text style={styles.entryTime}>
            {format(parseISO(entry.date), 'h:mm a')}
          </Text>
        </View>
        <Text style={styles.entryText}>{entry.content}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface EditEntryModalProps {
  visible: boolean;
  entry: Entry | null;
  onSave: (content: string, category: Category, customCategory: string) => void;
  onCancel: () => void;
}

const EditEntryModal = ({ visible, entry, onSave, onCancel }: EditEntryModalProps) => {
  const [content, setContent] = useState(entry?.content || '');
  const [selectedCategory, setSelectedCategory] = useState<Category>(entry?.category as Category || 'health');
  const [customCategory, setCustomCategory] = useState(entry?.custom_category || '');

  if (entry) {
    setContent(entry.content);
    setSelectedCategory(entry.category as Category);
    setCustomCategory(entry.custom_category || '');
  }

  const handleSave = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Entry cannot be empty');
      return;
    }
    onSave(content, selectedCategory, customCategory);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>Edit Entry</Text>
          
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  { borderColor: selectedCategory === cat.value ? cat.color : '#334155' },
                  selectedCategory === cat.value && { backgroundColor: cat.color + '20' },
                ]}
                onPress={() => setSelectedCategory(cat.value as Category)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text 
                  style={[
                    styles.categoryButtonText,
                    { color: selectedCategory === cat.value ? cat.color : '#94A3B8' }
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
              placeholderTextColor="#64748B"
            />
          )}

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What did you learn?"
            value={content}
            onChangeText={setContent}
            multiline
            placeholderTextColor="#64748B"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const { entries, updateEntry, deleteEntry } = useEntriesStore();
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const groupedEntries = groupEntriesByDate(entries);

  const handleLongPress = (entry: Entry) => {
    setSelectedEntry(entry);
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (selectedEntry && user) {
              const { error } = await deleteEntry(selectedEntry.id, user.id);
              if (error) {
                Alert.alert('Error', 'Failed to delete entry');
              }
            }
          }
        },
      ]
    );
  };

  const handleSaveEdit = async (content: string, category: Category, customCategory: string) => {
    if (selectedEntry) {
      const { error } = await updateEntry(
        selectedEntry.id,
        content,
        category,
        category === 'custom' ? customCategory : null
      );
      if (error) {
        Alert.alert('Error', 'Failed to update entry');
      }
      setShowEditModal(false);
      setSelectedEntry(null);
    }
  };

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your journey to 1% better</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyText}>
            Start by making your first entry on the Today tab
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>Long press an entry to edit or delete</Text>
      
      <FlatList
        data={groupedEntries}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: group }) => (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{group.data.length}</Text>
              </View>
            </View>
            {group.data.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onLongPress={() => handleLongPress(entry)} />
            ))}
          </View>
        )}
      />

      <Modal visible={showMenu} animationType="fade" transparent>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setShowMenu(false)} activeOpacity={1}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Entry Options</Text>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
              <Text style={styles.menuItemIcon}>✏️</Text>
              <Text style={styles.menuItemText}>Edit Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.deleteMenuItem]} onPress={handleDelete}>
              <Text style={styles.menuItemIcon}>🗑️</Text>
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setShowMenu(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <EditEntryModal
        visible={showEditModal}
        entry={selectedEntry}
        onSave={handleSaveEdit}
        onCancel={() => {
          setShowEditModal(false);
          setSelectedEntry(null);
        }}
      />
    </View>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    marginLeft: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  entryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  categoryIndicator: {
    width: 4,
  },
  entryContent: {
    flex: 1,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  entryText: {
    fontSize: 15,
    color: '#F8FAFC',
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  menu: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#0F172A',
  },
  deleteMenuItem: {
    backgroundColor: '#EF444420',
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  deleteText: {
    color: '#EF4444',
  },
  menuCancel: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#0F172A',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
