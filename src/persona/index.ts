/**
 * The cat's personality and voice.
 *
 * Before we build the parser (Phase 4) and LLM brain (Phase 4b), the cat
 * responds with canned replies that match the language of the user's message.
 * This gives us a working chat experience to build on.
 *
 * The cat is warm, supportive, and a little playful — never robotic or naggy.
 */

/** Detect whether text contains Chinese characters. */
export function detectLang(text: string): 'en' | 'zh' {
  return /[\u4e00-\u9fff]/.test(text) ? 'zh' : 'en';
}

const greetings = {
  en: [
    "Hi there! 🐱 I'm Cato, your little reminder cat. Tell me what to remember!",
    "Hey! 🐱 What can I help you remember today?",
    "Meow! 🐱 I'm here to help. What's on your mind?",
  ],
  zh: [
    "你好呀！🐱 我是Cato，你的提醒小猫咪。告诉我你需要记住什么吧！",
    "嗨！🐱 今天我能帮你记什么呢？",
    "喵～🐱 我在这里帮忙哦，你有什么想说的？",
  ],
};

const acknowledgements = {
  en: [
    "Got it! 📝 I'll remember that for you.",
    "Noted! ✨ Anything else?",
    "On it! 🐾 I've written that down.",
    "Sure thing! 📋 I'll keep track of that.",
  ],
  zh: [
    "收到啦！📝 我帮你记下了。",
    "好的！✨ 还有别的吗？",
    "喵～🐾 已经记好了。",
    "没问题！📋 我会帮你记着的。",
  ],
};

const encouragements = {
  en: [
    "You've got this! 💪",
    "One step at a time 🐾",
    "I'm proud of you! ✨",
    "You're doing great! 🌟",
  ],
  zh: [
    "你可以的！💪",
    "一步一步来🐾",
    "我为你骄傲！✨",
    "做得好！🌟",
  ],
};

const confused = {
  en: [
    "Hmm, I'm not sure what you mean yet 🤔 Try something like 'remind me to...' or 'check in reading'!",
    "I'm still learning! 🐱 Try telling me a reminder or checking in a habit.",
  ],
  zh: [
    "嗯，我还不太明白你的意思🤔 试试说 '提醒我...' 或者 '打卡看书' 吧！",
    "我还在学习中！🐱 试着告诉我一个提醒或者打卡一个习惯。",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Get the cat's welcome message when chat is first opened. */
export function getGreeting(lang: 'en' | 'zh' = 'en', catName: string = 'Cato'): string {
  const template = pick(greetings[lang]);
  return template.replace(/Cato/g, catName);
}

/**
 * Get a canned reply from the cat (fallback when parser isn't used).
 */
export function getCannedReply(userText: string): string {
  const lang = detectLang(userText);

  const lower = userText.toLowerCase();
  if (lower.match(/^(hi|hey|hello|yo|sup)/)) return pick(greetings[lang]);
  if (lower.match(/^(你好|嗨|哈喽)/)) return pick(greetings[lang]);
  if (lower.match(/thank|谢/)) return pick(encouragements[lang]);

  if (userText.length > 3) return pick(acknowledgements[lang]);
  return pick(confused[lang]);
}

// --- Context-aware replies (used after parsing) ---

const taskCreated = {
  en: [
    (title: string, time: string) => `Got it! 📝 I'll remind you to "${title}"${time}. You've got this! 🐾`,
    (title: string, time: string) => `Done! ✨ "${title}" is saved${time}. I'll nudge you when it's time!`,
    (title: string, time: string) => `Noted! 📋 "${title}"${time}. Leave it to me! 🐱`,
  ],
  zh: [
    (title: string, time: string) => `收到！📝 我会提醒你"${title}"${time}。加油！🐾`,
    (title: string, time: string) => `好的！✨ "${title}"已记下${time}。到时候我会提醒你的！`,
    (title: string, time: string) => `记好了！📋 "${title}"${time}。交给我吧！🐱`,
  ],
};

const habitCreated = {
  en: [
    (name: string) => `New habit: "${name}" 🌱 Say "check in ${name}" when you do it. Let's build that streak!`,
    (name: string) => `Started tracking "${name}"! ✨ Check in daily and watch your streak grow 🔥`,
  ],
  zh: [
    (name: string) => `新习惯："${name}" 🌱 做完后说"打卡${name}"，一起培养好习惯吧！`,
    (name: string) => `开始追踪"${name}"啦！✨ 每天打卡，看看你的连续天数 🔥`,
  ],
};

const habitCheckedIn = {
  en: [
    (name: string, streak: number) => `Checked in "${name}"! ✅ ${streak > 1 ? `${streak}-day streak! 🔥` : 'Day 1 — here we go! 🌱'}`,
    (name: string, streak: number) => `Done! ✅ "${name}" — ${streak > 1 ? `streak: ${streak} days! Keep it up! 💪` : 'first day! Let\'s keep going 🐾'}`,
  ],
  zh: [
    (name: string, streak: number) => `打卡"${name}"成功！✅ ${streak > 1 ? `连续${streak}天！🔥` : '第一天，加油！🌱'}`,
    (name: string, streak: number) => `完成！✅ "${name}" — ${streak > 1 ? `连续打卡${streak}天！继续保持！💪` : '第一天打卡！一起加油🐾'}`,
  ],
};

const alreadyCheckedIn = {
  en: [
    (name: string) => `You already checked in "${name}" today! 😸 Rest up and come back tomorrow.`,
  ],
  zh: [
    (name: string) => `你今天已经打卡"${name}"了！😸 好好休息，明天继续哦。`,
  ],
};

const habitNotFound = {
  en: [
    (name: string) => `I don't have a habit called "${name}" yet. Want me to start tracking it? Say "track ${name}" 🐱`,
  ],
  zh: [
    (name: string) => `我还没有"${name}"这个习惯呢。要我开始追踪吗？说"习惯${name}" 🐱`,
  ],
};

const chitchatReplies = {
  en: [
    "I'm here for you! 🐱 What do you need to remember?",
    "Hey! 😸 Tell me a reminder or check in a habit!",
    ...encouragements.en,
  ],
  zh: [
    "我在呢！🐱 你需要记住什么？",
    "嗨！😸 告诉我一个提醒或者打卡一个习惯吧！",
    ...encouragements.zh,
  ],
};

function formatTime(dueAt: number | null, lang: 'en' | 'zh'): string {
  if (!dueAt) return '';
  const d = new Date(dueAt);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  if (lang === 'zh') {
    if (isToday) return ` 今天${time}`;
    if (isTomorrow) return ` 明天${time}`;
    return ` ${d.toLocaleDateString('zh-CN')} ${time}`;
  }

  if (isToday) return ` today at ${time}`;
  if (isTomorrow) return ` tomorrow at ${time}`;
  return ` on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
}

export function replyTaskCreated(title: string, dueAt: number | null, lang: 'en' | 'zh'): string {
  const time = formatTime(dueAt, lang);
  return pick(taskCreated[lang])(title, time);
}

export function replyHabitCreated(name: string, lang: 'en' | 'zh'): string {
  return pick(habitCreated[lang])(name);
}

export function replyHabitCheckedIn(name: string, streak: number, lang: 'en' | 'zh'): string {
  return pick(habitCheckedIn[lang])(name, streak);
}

export function replyAlreadyCheckedIn(name: string, lang: 'en' | 'zh'): string {
  return pick(alreadyCheckedIn[lang])(name);
}

export function replyHabitNotFound(name: string, lang: 'en' | 'zh'): string {
  return pick(habitNotFound[lang])(name);
}

export function replyChitchat(lang: 'en' | 'zh'): string {
  return pick(chitchatReplies[lang]);
}

export function replyTaskList(tasks: { title: string; dueAt: number | null; completedAt: number | null }[], lang: 'en' | 'zh'): string {
  const pending = tasks.filter((t) => !t.completedAt);
  if (pending.length === 0) {
    return lang === 'zh'
      ? '你没有待办任务！🎉 好好休息吧～'
      : "You have no pending tasks! 🎉 Enjoy your free time~";
  }
  const lines = pending.slice(0, 5).map((t) => {
    const time = t.dueAt ? ` (${new Date(t.dueAt).toLocaleDateString()})` : '';
    return `• ${t.title}${time}`;
  });
  const header = lang === 'zh' ? `你有${pending.length}个待办：` : `You have ${pending.length} task${pending.length > 1 ? 's' : ''}:`;
  return `${header}\n${lines.join('\n')}`;
}

export function replyHabitList(habits: { name: string; streak: number; checkedInToday: boolean }[], lang: 'en' | 'zh'): string {
  if (habits.length === 0) {
    return lang === 'zh'
      ? '你还没有习惯呢！说"习惯 看书"来开始追踪 🌱'
      : 'You don\'t have any habits yet! Say "track reading" to start 🌱';
  }
  const lines = habits.map((h) => {
    const check = h.checkedInToday ? '✅' : '⬜';
    const streak = h.streak > 0 ? ` (🔥${h.streak})` : '';
    return `${check} ${h.name}${streak}`;
  });
  const header = lang === 'zh' ? '你的习惯：' : 'Your habits:';
  return `${header}\n${lines.join('\n')}`;
}
