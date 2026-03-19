import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import type { StoreItem } from '../types';

interface ConfirmPurchaseModalProps {
  visible: boolean;
  item: StoreItem | null;
  userXP: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const ConfirmPurchaseModal = ({
  visible,
  item,
  userXP,
  onConfirm,
  onCancel,
  loading,
}: ConfirmPurchaseModalProps) => {
  if (!item) return null;

  const remainingXP = userXP - item.cost;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={styles.title}>Confirm Purchase</Text>
          
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </View>

          <View style={styles.xpInfo}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>Your XP:</Text>
              <Text style={styles.xpValue}>{userXP}</Text>
            </View>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>Cost:</Text>
              <Text style={[styles.xpValue, styles.xpCost]}>-{item.cost}</Text>
            </View>
            <View style={[styles.xpRow, styles.xpTotal]}>
              <Text style={styles.xpLabel}>Remaining:</Text>
              <Text style={styles.xpValue}>{remainingXP}</Text>
            </View>
          </View>

          <View style={styles.weeklyNote}>
            <Text style={styles.weeklyNoteText}>This purchase resets weekly</Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]} 
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmText}>
                {loading ? 'Purchasing...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  itemInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  xpInfo: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpTotal: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  xpLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  xpCost: {
    color: '#EF4444',
  },
  weeklyNote: {
    marginBottom: 20,
  },
  weeklyNoteText: {
    fontSize: 12,
    color: '#64748B',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
