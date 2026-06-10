import { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontFamily, spacing, borderRadius } from '../../src/theme';
import { useStore } from '../../src/store';
import type { Task } from '../../src/db';

type ViewMode = 'list' | 'week' | 'month';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDue(dueAt: number | null): string {
  if (!dueAt) return '';
  const d = new Date(dueAt);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = formatTime(dueAt);
  if (isSameDay(d, now)) return `Today, ${time}`;
  if (isSameDay(d, tomorrow)) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

// ─── Shared task item ───

function TaskItem({
  task, onComplete, onDelete, compact,
}: {
  task: Task; onComplete: () => void; onDelete: () => void; compact?: boolean;
}) {
  const isDone = !!task.completedAt;
  const isOverdue = !isDone && task.dueAt && task.dueAt < Date.now();

  if (compact) {
    return (
      <Pressable style={styles.compactTask} onPress={!isDone ? onComplete : undefined}>
        <Ionicons
          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
          size={16}
          color={isDone ? colors.success : isOverdue ? colors.danger : colors.textMuted}
        />
        <Text style={[styles.compactTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>
          {task.title}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.taskRow} onPress={!isDone ? onComplete : undefined}>
      <Pressable onPress={onComplete} style={styles.checkbox} hitSlop={8}>
        <Ionicons
          name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isDone ? colors.success : isOverdue ? colors.danger : colors.textMuted}
        />
      </Pressable>
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        {task.dueAt ? (
          <Text style={[styles.taskDue, isOverdue ? styles.taskOverdue : undefined]}>
            {formatDue(task.dueAt)}
          </Text>
        ) : null}
      </View>
      {isDone && (
        <Pressable onPress={onDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}

// ─── View toggle ───

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const options: { key: ViewMode; label: string }[] = [
    { key: 'list', label: 'List' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];
  return (
    <View style={styles.toggleRow}>
      {options.map((o) => (
        <Pressable
          key={o.key}
          style={[styles.toggleChip, mode === o.key && styles.toggleChipActive]}
          onPress={() => onChange(o.key)}
        >
          <Text style={[styles.toggleText, mode === o.key && styles.toggleTextActive]}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── List view (existing) ───

function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  if (count === 0) return null;
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{count}</Text>
    </View>
  );
}

function ListView({
  tasks, onComplete, onDelete,
}: {
  tasks: Task[]; onComplete: (id: string) => void; onDelete: (id: string) => void;
}) {
  const now = Date.now();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const overdue = tasks.filter((t) => !t.completedAt && t.dueAt && t.dueAt < now);
  const today = tasks.filter((t) => !t.completedAt && t.dueAt && t.dueAt >= now && t.dueAt <= todayEnd.getTime());
  const upcoming = tasks.filter((t) => !t.completedAt && (!t.dueAt || t.dueAt > todayEnd.getTime()));
  const done = tasks.filter((t) => t.completedAt);

  type ListItem = { type: 'header'; title: string; count: number; color: string } | { type: 'task'; task: Task };
  const data: ListItem[] = [];

  if (overdue.length > 0) data.push({ type: 'header', title: 'Overdue', count: overdue.length, color: colors.danger });
  overdue.forEach((t) => data.push({ type: 'task', task: t }));
  if (today.length > 0) data.push({ type: 'header', title: 'Today', count: today.length, color: colors.accent });
  today.forEach((t) => data.push({ type: 'task', task: t }));
  if (upcoming.length > 0) data.push({ type: 'header', title: 'Upcoming', count: upcoming.length, color: colors.textSecondary });
  upcoming.forEach((t) => data.push({ type: 'task', task: t }));
  if (done.length > 0) data.push({ type: 'header', title: 'Done', count: done.length, color: colors.success });
  done.forEach((t) => data.push({ type: 'task', task: t }));

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => (item.type === 'header' ? `h-${item.title}` : item.task.id)}
      renderItem={({ item }) => {
        if (item.type === 'header') return <SectionHeader title={item.title} count={item.count} color={item.color} />;
        return <TaskItem task={item.task} onComplete={() => onComplete(item.task.id)} onDelete={() => onDelete(item.task.id)} />;
      }}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ─── Week view ───

function WeekView({
  tasks, weekOffset, onComplete, onDelete,
}: {
  tasks: Task[]; weekOffset: number; onComplete: (id: string) => void; onDelete: (id: string) => void;
}) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const pendingTasks = tasks.filter((t) => !t.completedAt);

  return (
    <ScrollView contentContainerStyle={styles.weekContainer} showsVerticalScrollIndicator={false}>
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const dayTasks = pendingTasks.filter((t) => t.dueAt && isSameDay(new Date(t.dueAt), day));

        return (
          <View key={day.toISOString()} style={styles.weekDay}>
            <View style={styles.weekDayHeader}>
              <Text style={[styles.weekDayName, isToday && styles.weekDayToday]}>
                {DAYS_SHORT[day.getDay()]}
              </Text>
              <View style={[styles.weekDateCircle, isToday && styles.weekDateCircleToday]}>
                <Text style={[styles.weekDateNum, isToday && styles.weekDateNumToday]}>
                  {day.getDate()}
                </Text>
              </View>
            </View>
            <View style={styles.weekDayTasks}>
              {dayTasks.length === 0 && (
                <Text style={styles.weekNoTasks}>—</Text>
              )}
              {dayTasks.map((t) => (
                <TaskItem key={t.id} task={t} compact onComplete={() => onComplete(t.id)} onDelete={() => onDelete(t.id)} />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Month view ───

function MonthView({
  tasks, monthOffset, onSelectDate,
}: {
  tasks: Task[]; monthOffset: number; onSelectDate: (d: Date) => void;
}) {
  const today = new Date();
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const pendingTasks = tasks.filter((t) => !t.completedAt && t.dueAt);

  const tasksByDate = new Map<number, Task[]>();
  for (const t of pendingTasks) {
    const d = new Date(t.dueAt!);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const key = d.getDate();
      if (!tasksByDate.has(key)) tasksByDate.set(key, []);
      tasksByDate.get(key)!.push(t);
    }
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.monthContainer}>
      <View style={styles.monthDayNames}>
        {DAYS_SHORT.map((d) => (
          <Text key={d} style={styles.monthDayLabel}>{d}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.monthRow}>
          {row.map((day, ci) => {
            if (day === null) return <View key={ci} style={styles.monthCell} />;

            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const dayTaskList = tasksByDate.get(day) || [];
            const hasOverdue = dayTaskList.some((t) => t.dueAt! < Date.now());

            return (
              <Pressable
                key={ci}
                style={styles.monthCell}
                onPress={() => {
                  const selected = new Date(year, month, day);
                  onSelectDate(selected);
                }}
              >
                <View style={[styles.monthDateWrap, isToday && styles.monthDateToday]}>
                  <Text style={[styles.monthDateText, isToday && styles.monthDateTextToday]}>
                    {day}
                  </Text>
                </View>
                {dayTaskList.length > 0 && (
                  <View style={styles.monthDots}>
                    {dayTaskList.slice(0, 3).map((_, di) => (
                      <View
                        key={di}
                        style={[styles.monthDot, { backgroundColor: hasOverdue ? colors.danger : colors.accent }]}
                      />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ───

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const completeTask = useStore((s) => s.completeTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleComplete = useCallback((id: string) => completeTask(id), [completeTask]);
  const handleDelete = useCallback((id: string) => deleteTask(id), [deleteTask]);

  const navLabel = useMemo(() => {
    if (viewMode === 'week') {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const fmt = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${fmt(start)} — ${fmt(end)}`;
    }
    if (viewMode === 'month') {
      const d = new Date();
      d.setMonth(d.getMonth() + monthOffset);
      return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    return '';
  }, [viewMode, weekOffset, monthOffset]);

  const handlePrev = () => viewMode === 'week' ? setWeekOffset((o) => o - 1) : setMonthOffset((o) => o - 1);
  const handleNext = () => viewMode === 'week' ? setWeekOffset((o) => o + 1) : setMonthOffset((o) => o + 1);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => !t.completedAt && t.dueAt && isSameDay(new Date(t.dueAt), selectedDate));
  }, [selectedDate, tasks]);

  if (tasks.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTitle}>No tasks yet</Text>
        <Text style={styles.emptyHint}>
          Tell Cato something like{'\n'}"remind me to buy milk tomorrow"
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Tasks</Text>
        <ViewToggle mode={viewMode} onChange={(m) => { setViewMode(m); setSelectedDate(null); }} />
      </View>

      {viewMode !== 'list' && (
        <View style={styles.navRow}>
          <Pressable onPress={handlePrev} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.accent} />
          </Pressable>
          <Text style={styles.navLabel}>{navLabel}</Text>
          <Pressable onPress={handleNext} hitSlop={8}>
            <Ionicons name="chevron-forward" size={22} color={colors.accent} />
          </Pressable>
        </View>
      )}

      {viewMode === 'list' && (
        <ListView tasks={tasks} onComplete={handleComplete} onDelete={handleDelete} />
      )}

      {viewMode === 'week' && (
        <WeekView tasks={tasks} weekOffset={weekOffset} onComplete={handleComplete} onDelete={handleDelete} />
      )}

      {viewMode === 'month' && (
        <>
          <MonthView tasks={tasks} monthOffset={monthOffset} onSelectDate={setSelectedDate} />
          {selectedDate && (
            <View style={styles.selectedDay}>
              <Text style={styles.selectedDayTitle}>
                {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              {selectedDayTasks.length === 0 ? (
                <Text style={styles.selectedDayEmpty}>No tasks</Text>
              ) : (
                selectedDayTasks.map((t) => (
                  <TaskItem key={t.id} task={t} onComplete={() => handleComplete(t.id)} onDelete={() => handleDelete(t.id)} />
                ))
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: 2,
  },
  toggleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm - 2,
  },
  toggleChipActive: {
    backgroundColor: colors.card,
  },
  toggleText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textPrimary,
  },

  // Nav (week/month arrows)
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  navLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },

  // List view
  list: { paddingBottom: spacing.xxl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.xs,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    fontSize: fontSize.sm, fontFamily: fontFamily.semibold,
    textTransform: 'uppercase', letterSpacing: 0.6, flex: 1,
  },
  sectionCount: { fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md - 2, paddingHorizontal: spacing.xs,
    gap: spacing.md - 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator,
  },
  checkbox: { justifyContent: 'center', alignItems: 'center' },
  taskContent: { flex: 1 },
  taskTitle: {
    fontSize: fontSize.md, fontFamily: fontFamily.regular,
    color: colors.textPrimary, lineHeight: 22,
  },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskDue: {
    fontSize: fontSize.sm, fontFamily: fontFamily.regular,
    color: colors.textSecondary, marginTop: 2,
  },
  taskOverdue: { color: colors.danger },

  // Compact task (used in week view)
  compactTask: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 3,
  },
  compactTitle: {
    fontSize: fontSize.sm, fontFamily: fontFamily.regular,
    color: colors.textPrimary, flex: 1,
  },

  // Week view
  weekContainer: { paddingBottom: spacing.xxl },
  weekDay: {
    flexDirection: 'row',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
    minHeight: 52,
  },
  weekDayHeader: {
    width: 52, alignItems: 'center', gap: 2,
  },
  weekDayName: {
    fontSize: 11, fontFamily: fontFamily.medium,
    color: colors.textMuted, textTransform: 'uppercase',
  },
  weekDayToday: { color: colors.accent },
  weekDateCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  weekDateCircleToday: { backgroundColor: colors.accent },
  weekDateNum: {
    fontSize: fontSize.md, fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  weekDateNumToday: { color: colors.textOnAccent },
  weekDayTasks: { flex: 1, justifyContent: 'center', paddingLeft: spacing.sm },
  weekNoTasks: {
    fontSize: fontSize.sm, color: colors.textMuted, fontFamily: fontFamily.regular,
  },

  // Month view
  monthContainer: { paddingHorizontal: spacing.xs },
  monthDayNames: {
    flexDirection: 'row', marginBottom: spacing.xs,
  },
  monthDayLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontFamily: fontFamily.medium,
    color: colors.textMuted, textTransform: 'uppercase',
  },
  monthRow: { flexDirection: 'row' },
  monthCell: {
    flex: 1, alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  monthDateWrap: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  monthDateToday: { backgroundColor: colors.accent },
  monthDateText: {
    fontSize: fontSize.sm, fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  monthDateTextToday: { color: colors.textOnAccent, fontFamily: fontFamily.bold },
  monthDots: {
    flexDirection: 'row', gap: 3, marginTop: 3,
  },
  monthDot: {
    width: 5, height: 5, borderRadius: 3,
  },

  // Selected day (month tap)
  selectedDay: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  selectedDayTitle: {
    fontSize: fontSize.md, fontFamily: fontFamily.semibold,
    color: colors.textPrimary, marginBottom: spacing.sm,
  },
  selectedDayEmpty: {
    fontSize: fontSize.sm, fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },

  // Empty
  empty: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.xl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.textPrimary },
  emptyHint: {
    fontSize: fontSize.md, fontFamily: fontFamily.regular,
    color: colors.textMuted, textAlign: 'center', lineHeight: 24, marginTop: spacing.xs,
  },
});
