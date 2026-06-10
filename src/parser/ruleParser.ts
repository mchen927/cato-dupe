import { parseDate } from './dateParser';
import { detectLang } from '../persona';
import type { ParseResult, Parser } from './types';

/**
 * Rule-based parser — the offline fallback.
 *
 * Steps:
 * 1. Detect language (Chinese characters? → zh, else → en)
 * 2. Detect intent via keyword matching
 * 3. Extract date/time using our custom dateParser
 * 4. Decide deadline vs fixedTime
 * 5. Clean the title (remove date words)
 */

// --- Intent detection patterns ---

const CHECK_IN_PATTERNS = [
  /^(?:check\s*in|done|finished|completed|did)\s+(.+)/i,
  /^(?:log|mark)\s+(.+?)(?:\s+(?:done|complete))?$/i,
  /^打卡(.+)/,
  /^完成(.+)/,
  /^签到(.+)/,
];

const CREATE_HABIT_PATTERNS = [
  /^(?:track|new habit|start tracking|add habit)\s+(.+)/i,
  /^(?:习惯|新习惯|追踪)\s*(.+)/,
];

const LIST_TASKS_PATTERNS = [
  /^(?:show|list|what are|what's|whats)\s*(?:my\s*)?(?:tasks?|reminders?|to\s*-?\s*dos?)/i,
  /^(?:看看|显示|有什么)(?:任务|提醒|待办)/,
];

const LIST_HABITS_PATTERNS = [
  /^(?:show|list|what are|what's|whats)\s*(?:my\s*)?habits?/i,
  /^(?:show|list)\s*(?:my\s*)?(?:check\s*ins?|streaks?)/i,
  /^(?:看看|显示|有什么)(?:习惯|打卡)/,
  /^(?:我的)?打卡(?:有什么|记录)/,
];

const CHITCHAT_PATTERNS = [
  /^(?:hi|hey|hello|yo|sup|good\s*(?:morning|afternoon|evening|night)|thanks?|thank\s*you|bye|see\s*you|love\s*you)[\s!.?]*$/i,
  /^(?:你好|嗨|哈喽|谢谢|早上好|晚上好|晚安|再见|爱你)[\s!.?]*$/,
  /^(?:how are you|how's it going|what's up)[\s!.?]*$/i,
];

// --- Deadline detection ---

const DEADLINE_WORDS_EN = /\b(?:by|before|due|until|no later than|deadline)\b/i;
const DEADLINE_WORDS_ZH = /(?:之前|以前|截止|前|内)/;

// --- Title cleaning ---

// Applied in order. Each strips a layer of conversational fluff.
const TITLE_CLEANERS_EN: RegExp[] = [
  // Greetings at the start: "hi,", "hey,", "hello,"
  /^(?:hi|hey|hello|yo)[,!.\s]+/i,
  // Conversational openers: "what about", "oh", "also", "and", "btw"
  /^(?:what\s+about|oh|also|and|btw|so|ok|okay|well|umm?|hmm?)[,\s]+/i,
  // Request wrappers: "can/cna u/you", "could u/you", "would u/you", "please"
  /^(?:(?:can|cna|could|would)\s+(?:you|u|ya)\s+)?(?:please\s+)?/i,
  // Help phrases: "help me remember to", "help me to"
  /^(?:help\s+me\s+(?:to\s+)?(?:remember\s+(?:to\s+)?)?)/i,
  // Action phrases: "make sure to tell/remind me", "remind me to", "remember to", etc.
  /^(?:make\s+sure\s+(?:to\s+)?(?:tell|remind)\s+(?:me\s+)?(?:to\s+)?)/i,
  /^(?:remind\s*(?:me\s*)?(?:to\s*)?)/i,
  /^(?:tell\s+me\s+(?:to\s+)?)/i,
  /^(?:remember\s*(?:to\s*)?)/i,
  /^(?:don'?t\s*forget\s*(?:to\s*)?)/i,
  /^(?:i\s*(?:need|have|want|gotta|should|must)\s*(?:to\s*)?)/i,
];

const TITLE_CLEANERS_ZH: RegExp[] = [
  /^(?:提醒我|记得|别忘了|不要忘记|我(?:需要|要|得|想))/,
];

function cleanTitle(text: string, dateText: string | null, lang: 'en' | 'zh'): string {
  let title = text;

  // Remove the date phrase first so cleaners don't stumble over it
  if (dateText) {
    title = title.replace(dateText, ' ');
  }

  const cleaners = lang === 'en' ? TITLE_CLEANERS_EN : TITLE_CLEANERS_ZH;
  for (const re of cleaners) {
    title = title.replace(re, '').trim();
  }

  // Clean up leftover prepositions and punctuation
  title = title
    .replace(/^\s*(?:that|to|at|on|in|by|before|for)\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .replace(/^[,.\s]+|[,.\s]+$/g, '');

  // Capitalize first letter for clean display
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title || text.trim();
}

export const ruleParser: Parser = {
  async parse(input: string): Promise<ParseResult> {
    const trimmed = input.trim();
    const lang = detectLang(trimmed);

    for (const pattern of CHITCHAT_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { kind: 'chitchat', lang };
      }
    }

    for (const pattern of LIST_TASKS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { kind: 'listTasks', lang };
      }
    }
    for (const pattern of LIST_HABITS_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { kind: 'listHabits', lang };
      }
    }

    for (const pattern of CHECK_IN_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        return { kind: 'checkInHabit', habitName: match[1].trim(), lang };
      }
    }

    for (const pattern of CREATE_HABIT_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        return { kind: 'createHabit', habitName: match[1].trim(), lang };
      }
    }

    const parsed = parseDate(trimmed);
    const dueAt = parsed ? parsed.date.getTime() : null;
    const dateText = parsed ? parsed.matchedText : null;

    const hasDeadlineWord = DEADLINE_WORDS_EN.test(trimmed) || DEADLINE_WORDS_ZH.test(trimmed);
    const hasExplicitTime = parsed?.hasExplicitTime ?? false;
    const type = hasDeadlineWord ? 'deadline' as const
      : hasExplicitTime ? 'fixedTime' as const
      : 'deadline' as const;

    const title = cleanTitle(trimmed, dateText, lang);

    if (!dueAt && trimmed.length < 8) {
      return { kind: 'chitchat', lang };
    }

    return { kind: 'createTask', title, dueAt, type, lang };
  },
};
