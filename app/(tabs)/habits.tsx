import { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontFamily, spacing, borderRadius } from '../../src/theme';
import { useStore, type HabitWithStreak } from '../../src/store';

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;

  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakText}>🔥 {streak}</Text>
    </View>
  );
}

function HabitCard({
  habit,
  onCheckIn,
}: {
  habit: HabitWithStreak;
  onCheckIn: () => void;
}) {
  return (
    <View style={styles.habitRow}>
      <Text style={styles.habitEmoji}>{habit.emoji || '✨'}</Text>

      <View style={styles.habitInfo}>
        <Text style={styles.habitName}>{habit.name}</Text>
        <View style={styles.habitMeta}>
          <StreakBadge streak={habit.streak} />
          {habit.streak === 0 && (
            <Text style={styles.habitHint}>Start your streak today</Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={onCheckIn}
        disabled={habit.checkedInToday}
        hitSlop={8}
      >
        <Ionicons
          name={habit.checkedInToday ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={habit.checkedInToday ? colors.success : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const habits = useStore((s) => s.habits);
  const checkInHabit = useStore((s) => s.checkInHabit);

  const handleCheckIn = useCallback(
    (id: string) => checkInHabit(id),
    [checkInHabit],
  );

  const checkedCount = habits.filter((h) => h.checkedInToday).length;

  if (habits.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>🔥</Text>
        <Text style={styles.emptyTitle}>No habits yet</Text>
        <Text style={styles.emptyHint}>
          Tell Cato something like{'\n'}"track meditation" or "track reading"
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.screenTitle}>Habits</Text>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryBold}>{checkedCount}</Text>
          <Text style={styles.summaryMuted}> / {habits.length} today</Text>
        </Text>
        {checkedCount === habits.length && habits.length > 0 && (
          <Text style={styles.summaryDone}>All done 🎉</Text>
        )}
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HabitCard
            habit={item}
            onCheckIn={() => handleCheckIn(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: fontSize.md,
  },
  summaryBold: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  summaryMuted: {
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  summaryDone: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    color: colors.success,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  habitEmoji: {
    fontSize: 28,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: spacing.sm,
  },
  habitHint: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  streakBadge: {
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
  },
  empty: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  emptyHint: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.xs,
  },
});
