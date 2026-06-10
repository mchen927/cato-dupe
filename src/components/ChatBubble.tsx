import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import { colors, fontSize, spacing, borderRadius, fontFamily } from '../theme';

interface Props {
  text: string;
  role: 'user' | 'cat';
  timestamp?: number;
}

export function ChatBubble({ text, role, timestamp }: Props) {
  const isCat = role === 'cat';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.row,
        isCat ? styles.rowLeft : styles.rowRight,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.bubble, isCat ? styles.catBubble : styles.userBubble]}>
        <Text style={[styles.text, isCat ? styles.catText : styles.userText]}>
          {text}
        </Text>
        {timestamp && (
          <Text style={[styles.time, isCat ? styles.catTime : styles.userTime]}>
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingHorizontal: spacing.md,
  },
  rowLeft: {
    justifyContent: 'flex-start',
    marginRight: 60,
  },
  rowRight: {
    justifyContent: 'flex-end',
    marginLeft: 60,
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md - 2,
    borderRadius: borderRadius.lg,
  },
  catBubble: {
    backgroundColor: colors.catBubble,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: fontSize.md,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
  },
  catText: {
    color: colors.textPrimary,
  },
  userText: {
    color: colors.textOnAccent,
  },
  time: {
    fontSize: 11,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
    fontFamily: fontFamily.regular,
  },
  catTime: {
    color: colors.textMuted,
  },
  userTime: {
    color: 'rgba(255,255,255,0.55)',
  },
});
