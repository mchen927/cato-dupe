import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, FlatList, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontFamily } from '../../src/theme';
import { useSettings } from '../../src/settings';
import { useStore } from '../../src/store';
import { ChatBubble } from '../../src/components/ChatBubble';
import { ChatInput } from '../../src/components/ChatInput';
import { TypingIndicator } from '../../src/components/TypingIndicator';
import { parse } from '../../src/parser';
import {
  getGreeting,
  replyTaskCreated,
  replyHabitCreated,
  replyHabitCheckedIn,
  replyAlreadyCheckedIn,
  replyHabitNotFound,
  replyChitchat,
  replyTaskList,
  replyHabitList,
} from '../../src/persona';
import type { Message } from '../../src/db';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [isTyping, setIsTyping] = useState(false);
  const messages = useStore((s) => s.messages);
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const addMessage = useStore((s) => s.addMessage);
  const addTask = useStore((s) => s.addTask);
  const addHabit = useStore((s) => s.addHabit);
  const checkInHabit = useStore((s) => s.checkInHabit);
  const isLoaded = useStore((s) => s.isLoaded);
  const catName = useSettings((s) => s.catName) || 'Cato';
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (isLoaded && messages.length === 0) {
      addMessage('cat', getGreeting('en', catName));
    }
  }, [isLoaded, messages.length, addMessage, catName]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    if (isTyping) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isTyping]);

  const handleSend = useCallback(async (text: string) => {
    await addMessage('user', text);
    setIsTyping(true);

    try {
      const result = await parse(text);

      let fallbackReply: string;

      switch (result.kind) {
        case 'createTask': {
          const isPast = result.dueAt !== null && result.dueAt <= Date.now();
          if (isPast) {
            fallbackReply = result.lang === 'zh'
              ? `⏰ "${result.title}"的时间已经过了哦～能告诉我一个新的时间吗？`
              : `⏰ Hmm, that time already passed! When would you like me to remind you about "${result.title}" instead?`;
            break;
          }
          await addTask(result.title, result.dueAt, result.type, result.lang);
          fallbackReply = replyTaskCreated(result.title, result.dueAt, result.lang);
          break;
        }

        case 'createHabit': {
          await addHabit(result.habitName);
          fallbackReply = replyHabitCreated(result.habitName, result.lang);
          break;
        }

        case 'checkInHabit': {
          const habit = habits.find(
            (h) => h.name.toLowerCase() === result.habitName.toLowerCase(),
          );
          if (!habit) {
            fallbackReply = replyHabitNotFound(result.habitName, result.lang);
            break;
          }
          const success = await checkInHabit(habit.id);
          if (success) {
            const updated = useStore.getState().habits.find((h) => h.id === habit.id);
            fallbackReply = replyHabitCheckedIn(habit.name, updated?.streak ?? 1, result.lang);
          } else {
            fallbackReply = replyAlreadyCheckedIn(habit.name, result.lang);
          }
          break;
        }

        case 'listTasks': {
          fallbackReply = replyTaskList(tasks, result.lang);
          break;
        }

        case 'listHabits': {
          fallbackReply = replyHabitList(habits, result.lang);
          break;
        }

        case 'chitchat': {
          fallbackReply = replyChitchat(result.lang);
          break;
        }
      }

      const isPastTask = result.kind === 'createTask' && result.dueAt !== null && result.dueAt <= Date.now();
      const reply = isPastTask ? fallbackReply! : (result.catReply || fallbackReply!);

      await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));

      setIsTyping(false);
      await addMessage('cat', reply);
    } catch (e) {
      console.warn('Parse error:', e);
      setIsTyping(false);
      await addMessage('cat', "Hmm, I got a little confused there 🐱 Can you try again?");
    }
  }, [addMessage, addTask, addHabit, checkInHabit, habits, tasks]);

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingEmoji}>🐱</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerAvatar}>🐱</Text>
        <View>
          <Text style={styles.headerTitle}>{catName}</Text>
          <Text style={styles.headerSubtitle}>
            {isTyping ? 'typing...' : 'your reminder cat'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            text={item.text}
            role={item.role as 'user' | 'cat'}
            timestamp={item.createdAt}
          />
        )}
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
    gap: spacing.md,
  },
  headerAvatar: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.accent,
    marginTop: 1,
  },
  messageList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
  },
});
