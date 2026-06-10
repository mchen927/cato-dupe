/**
 * The Parser contract.
 *
 * This is the most important interface in the whole app. Every parser
 * implementation (rule-based, LLM, hybrid) must produce the same shape
 * of result. That means the rest of the app (chat, database, replies)
 * never cares HOW understanding happens -- it only cares WHAT was
 * understood.
 *
 * If we swap from rules to an LLM later, nothing else changes.
 */

/**
 * Every variant can optionally carry a `catReply` — a conversational
 * response from the LLM. When present, the chat screen uses it directly
 * instead of template replies. The rule parser never sets this field,
 * so template replies are the fallback.
 */
export type ParseResult =
  | {
      kind: 'createTask';
      title: string;
      dueAt: number | null;
      type: 'deadline' | 'fixedTime';
      lang: 'en' | 'zh';
      catReply?: string;
    }
  | {
      kind: 'checkInHabit';
      habitName: string;
      lang: 'en' | 'zh';
      catReply?: string;
    }
  | {
      kind: 'createHabit';
      habitName: string;
      lang: 'en' | 'zh';
      catReply?: string;
    }
  | {
      kind: 'listTasks';
      lang: 'en' | 'zh';
      catReply?: string;
    }
  | {
      kind: 'listHabits';
      lang: 'en' | 'zh';
      catReply?: string;
    }
  | {
      kind: 'chitchat';
      lang: 'en' | 'zh';
      catReply?: string;
    };

export interface Parser {
  parse(input: string): Promise<ParseResult>;
}
