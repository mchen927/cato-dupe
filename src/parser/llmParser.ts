import { config } from '../config';
import { detectLang } from '../persona';
import { useSettings } from '../settings';
import type { ParseResult, Parser } from './types';

/**
 * LLM-powered parser — the smart brain.
 *
 * Sends the user's message to OpenAI's API and gets back structured JSON
 * matching our ParseResult type. Handles typos, slang, creative phrasing,
 * and bilingual input out of the box.
 *
 * The API key lives in src/config.ts which is gitignored.
 * In production, this would go through a backend proxy to keep the key secret.
 */

const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

function getApiKey(): string | null {
  return config.openaiApiKey || null;
}

function buildSystemPrompt(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const { userName, catName } = useSettings.getState();

  const nameContext = userName
    ? `The user's name is ${userName}. Use their name occasionally (not every message) to be personal.`
    : '';

  return `You are ${catName || 'Cato'}, a warm and friendly bilingual (English + 中文) reminder cat 🐱.
Today is ${dayName}, ${dateStr}. Current time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}.
${nameContext}

Given a user message, extract the intent AND write a friendly conversational reply.
Return ONLY valid JSON (no markdown, no explanation).

Every response MUST include a "catReply" field — this is what you say back to the user.
Be warm, playful, and cat-like. Keep it short (1-2 sentences). Match the user's language.
IMPORTANT: Vary your tone and wording every time. Don't use the same phrases repeatedly.
Sometimes be playful, sometimes sweet, sometimes matter-of-fact, sometimes encouraging.
Sprinkle in cat emoji occasionally (🐱🐾😸) but not every single time.

Return ONE of these shapes:

1. Task/Reminder (any reminder, to-do, or thing to remember — even recurring ones):
   {"kind":"createTask","title":"<clean short action>","dueAt":"<ISO 8601 or null>","type":"<deadline|fixedTime>","lang":"<en|zh>","catReply":"<your friendly reply>"}

2. New habit (ONLY when user explicitly says "track X", "new habit X", or "start tracking X" — habits are for gamification/streaks, NOT for regular reminders):
   {"kind":"createHabit","habitName":"<name>","lang":"<en|zh>","catReply":"<your friendly reply>"}

3. Habit check-in (ONLY when user says "check in X", "done with X", "did X", "打卡X"):
   {"kind":"checkInHabit","habitName":"<name>","lang":"<en|zh>","catReply":"<your friendly reply>"}

4. List tasks:
   {"kind":"listTasks","lang":"<en|zh>","catReply":"<your friendly reply>"}

5. List habits:
   {"kind":"listHabits","lang":"<en|zh>","catReply":"<your friendly reply>"}

6. Chitchat:
   {"kind":"chitchat","lang":"<en|zh>","catReply":"<your friendly reply>"}

Rules:
- "title" should be CLEAN and short. Strip greetings and filler. "hi can u remind me to wash dishes tomorrow" → "Wash dishes"
- Capitalize the first letter of the title.
- "dueAt" must be ISO 8601 (e.g. "2026-06-10T17:00:00") or null.
- "type": "fixedTime" for specific times ("at 5pm"), "deadline" for date-only or "by/before".
- "lang": Chinese characters → "zh", otherwise → "en".
- IMPORTANT: "remind me to wash dishes every day" = createTask (it's a reminder). "track meditation" = createHabit (user explicitly wants to gamify it). When in doubt, use createTask.
- If the message contains MULTIPLE requests, handle the FIRST one and in catReply, naturally mention you caught the other one too and ask them to send it separately so you don't lose it.
- Do NOT just repeat the user's message in quotes. Be natural and conversational.

ABSTRACT / FUZZY TIMES:
When the user says something vague like "after school", "after work", "in the morning", "tonight", "this evening", "later", etc., use these sensible defaults:
  - "morning" / "早上" → 09:00
  - "afternoon" / "下午" → 14:00
  - "after school" / "放学后" → 15:30
  - "after work" / "下班后" → 18:00
  - "evening" / "this evening" / "tonight" / "晚上" → 20:00
  - "late night" / "深夜" → 22:00
  - "later" / "later today" → 2 hours from current time
Set type to "fixedTime" when using these defaults.
In your catReply, mention the time you picked so the user knows, e.g. "Got it! I'll remind you around 3:30 PM — let me know if that's off 🐾"
This way the user can correct it if needed.`;
}

const VALID_KINDS = ['createTask', 'createHabit', 'checkInHabit', 'listTasks', 'listHabits', 'chitchat'];

function validateResult(raw: unknown, inputLang: 'en' | 'zh'): ParseResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (!VALID_KINDS.includes(obj.kind as string)) return null;

  const lang = (obj.lang === 'en' || obj.lang === 'zh') ? obj.lang : inputLang;
  const catReply = typeof obj.catReply === 'string' ? obj.catReply : undefined;

  switch (obj.kind) {
    case 'createTask': {
      const title = typeof obj.title === 'string' ? obj.title : '';
      if (!title) return null;
      let dueAt: number | null = null;
      if (typeof obj.dueAt === 'string') {
        const d = new Date(obj.dueAt);
        if (!isNaN(d.getTime())) dueAt = d.getTime();
      }
      const type = obj.type === 'fixedTime' ? 'fixedTime' as const : 'deadline' as const;
      return { kind: 'createTask', title, dueAt, type, lang, catReply };
    }
    case 'createHabit': {
      const habitName = typeof obj.habitName === 'string' ? obj.habitName : '';
      if (!habitName) return null;
      return { kind: 'createHabit', habitName, lang, catReply };
    }
    case 'checkInHabit': {
      const habitName = typeof obj.habitName === 'string' ? obj.habitName : '';
      if (!habitName) return null;
      return { kind: 'checkInHabit', habitName, lang, catReply };
    }
    case 'listTasks':
      return { kind: 'listTasks', lang, catReply };
    case 'listHabits':
      return { kind: 'listHabits', lang, catReply };
    case 'chitchat':
      return { kind: 'chitchat', lang, catReply };
    default:
      return null;
  }
}

export const llmParser: Parser = {
  async parse(input: string): Promise<ParseResult> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('No API key configured');

    const lang = detectLang(input);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: input },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty API response');

    const parsed = JSON.parse(content);
    const result = validateResult(parsed, lang);
    if (!result) throw new Error('Invalid parse result from LLM');

    return result;
  },
};
