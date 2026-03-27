import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors } from '@/lib/colors';
import { fonts } from '@/lib/fonts';
import type { CatchupData, CatchupSpenderSummary, PocketMoneyEvent } from '@quiddo/shared';

interface Props {
  visible: boolean;
  catchup: CatchupData;
  onDismiss: () => void;
}

export default function CatchupModal({ visible, catchup, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>While you were away</Text>
              <Text style={styles.subtitle}>
                Here's what happened with pocket money. You can adjust any of these.
              </Text>
            </View>
            <TouchableOpacity onPress={onDismiss} hitSlop={12}>
              <Feather name="x" size={20} color={colors.bark[400]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {catchup.spenders.map(summary => (
              <SpenderRow key={summary.spender.id} summary={summary} />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onDismiss}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SpenderRow({ summary }: { summary: CatchupSpenderSummary }) {
  const [expanded, setExpanded] = useState(false);
  const { spender, pocket_money_events, goals_met } = summary;

  const releasedCount = pocket_money_events.filter(e => e.status === 'released').length;
  const withheldCount = pocket_money_events.filter(e => e.status === 'withheld').length;
  const totalEvents = pocket_money_events.length;
  const currencySymbol = spender.currency_symbol ?? '$';

  const summaryParts: string[] = [];
  if (totalEvents > 0) {
    summaryParts.push(`${totalEvents} pocket money run${totalEvents !== 1 ? 's' : ''}`);
    if (releasedCount > 0) summaryParts.push(`${releasedCount} released`);
    if (withheldCount > 0) summaryParts.push(`${withheldCount} withheld`);
  }
  if (goals_met.length > 0) {
    summaryParts.push(`${goals_met.length} goal${goals_met.length !== 1 ? 's' : ''} reached`);
  }

  return (
    <View style={styles.spenderCard}>
      <TouchableOpacity style={styles.spenderHeader} onPress={() => setExpanded(e => !e)}>
        <View
          style={[styles.avatar, { backgroundColor: spender.color ?? colors.eucalyptus[400] }]}
        >
          <Text style={styles.avatarText}>{spender.name[0].toUpperCase()}</Text>
        </View>
        <View style={styles.spenderInfo}>
          <Text style={styles.spenderName}>{spender.name}</Text>
          <Text style={styles.spenderSummary}>{summaryParts.join(' · ')}</Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.bark[400]}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.eventList}>
          {pocket_money_events.map(event => (
            <EventRow key={event.id} event={event} currencySymbol={currencySymbol} />
          ))}
          {goals_met.map(goal => (
            <View key={goal.id} style={styles.eventRow}>
              <Feather name="award" size={16} color={colors.wattle[400]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{goal.name}</Text>
                <Text style={styles.eventMeta}>
                  Goal reached · {currencySymbol}{parseFloat(goal.target_amount).toFixed(2)}
                </Text>
              </View>
              <Feather name="check-circle" size={16} color={colors.gumleaf[400]} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function EventRow({ event, currencySymbol }: { event: PocketMoneyEvent; currencySymbol: string }) {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(event.status);

  const date = new Date(event.scheduled_for);
  const dateLabel = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  async function release() {
    setProcessing(true);
    try {
      await api.post(`/catchup/pocket-money-events/${event.id}/release`);
      setLocalStatus('released');
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
    } finally {
      setProcessing(false);
    }
  }

  async function reverse() {
    setProcessing(true);
    try {
      await api.post(`/catchup/pocket-money-events/${event.id}/reverse`);
      setLocalStatus('withheld');
      queryClient.invalidateQueries({ queryKey: ['spenders'] });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <View style={styles.eventRow}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>{dateLabel}</Text>
        <Text style={styles.eventMeta}>
          {currencySymbol}{parseFloat(event.amount).toFixed(2)} pocket money
        </Text>
      </View>

      {processing ? (
        <ActivityIndicator size="small" color={colors.eucalyptus[400]} />
      ) : localStatus === 'withheld' ? (
        <View style={styles.eventActions}>
          <Text style={styles.withheldLabel}>Withheld</Text>
          <TouchableOpacity style={styles.releaseButton} onPress={release}>
            <Text style={styles.releaseButtonText}>Release</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.eventActions}>
          <Text style={styles.releasedLabel}>Released</Text>
          <TouchableOpacity style={styles.reverseButton} onPress={reverse}>
            <Text style={styles.reverseButtonText}>Reverse</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.bark[100],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.bark[700],
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.bark[400],
    maxWidth: 280,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  doneButton: {
    backgroundColor: colors.eucalyptus[400],
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#fff',
  },
  spenderCard: {
    borderWidth: 1,
    borderColor: colors.bark[200],
    borderRadius: 12,
    overflow: 'hidden',
  },
  spenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#fff',
  },
  spenderInfo: { flex: 1 },
  spenderName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.bark[700],
  },
  spenderSummary: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bark[400],
    marginTop: 1,
  },
  eventList: {
    borderTopWidth: 1,
    borderTopColor: colors.bark[100],
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.bark[100],
  },
  eventInfo: { flex: 1 },
  eventName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.bark[700],
  },
  eventMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bark[400],
    marginTop: 1,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  withheldLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bark[400],
  },
  releasedLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.gumleaf[400],
  },
  releaseButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gumleaf[300] ?? colors.gumleaf[400],
  },
  releaseButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.gumleaf[400],
  },
  reverseButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reverseButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.redearth[400],
  },
});
