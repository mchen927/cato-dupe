/**
 * Lightweight date parser — replaces chrono-node.
 *
 * Why not chrono-node? It ships locale files (Ukrainian, Finnish, etc.)
 * that Metro bundler can't resolve, causing build errors in React Native.
 * Since we only need English + basic Chinese date patterns, a small custom
 * parser is more reliable and lighter.
 *
 * Supports:
 *   - "today", "tonight", "tomorrow", "day after tomorrow"
 *   - "next Monday", "this Friday"
 *   - "at 5pm", "at 17:00", "at 5:30pm"
 *   - "in 2 hours", "in 30 minutes", "in 3 days"
 *   - "January 15", "Jan 15", "1/15"
 *   - Chinese: "今天", "明天", "后天", "下周一", "下午5点"
 *   - Combinations: "tomorrow at 5pm", "next Monday at 3:30pm"
 */

export interface DateParseResult {
  date: Date;
  matchedText: string;
  hasExplicitTime: boolean;
}

const DAY_NAMES: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const MONTH_NAMES: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

const ZH_DAYS: Record<string, number> = {
  '日': 0, '天': 0,
  '一': 1,
  '二': 2,
  '三': 3,
  '四': 4,
  '五': 5,
  '六': 6,
};

function parseTime(text: string): { hours: number; minutes: number; matched: string } | null {
  // Must have "at" prefix, am/pm suffix, or colon (H:MM) to count as a time.
  // Without this, bare numbers like "2" in "in 2 hours" get misread as 2:00 AM.
  const timeRe = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?\b|(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?|(\d{1,2})\s*(am|pm|AM|PM)/i;
  const match = text.match(timeRe);
  if (!match) return null;

  let hours: number;
  let minutes: number;
  let meridiem: string | undefined;

  if (match[1] !== undefined) {
    // "at 5", "at 5pm", "at 5:30pm"
    hours = parseInt(match[1], 10);
    minutes = match[2] ? parseInt(match[2], 10) : 0;
    meridiem = match[3]?.toLowerCase();
  } else if (match[4] !== undefined) {
    // "5:30", "5:30pm", "17:00"
    hours = parseInt(match[4], 10);
    minutes = parseInt(match[5], 10);
    meridiem = match[6]?.toLowerCase();
  } else {
    // "5pm", "5am"
    hours = parseInt(match[7], 10);
    minutes = 0;
    meridiem = match[8]?.toLowerCase();
  }

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  if (hours > 23 || minutes > 59) return null;

  return { hours, minutes, matched: match[0] };
}

function parseTimeZh(text: string): { hours: number; minutes: number; matched: string } | null {
  // "下午5点", "上午10点30分", "晚上8点", "5点半"
  const zhTimeRe = /(早上|上午|中午|下午|晚上)?(\d{1,2})点(?:(\d{1,2})分|半)?/;
  const match = text.match(zhTimeRe);
  if (!match) return null;

  let hours = parseInt(match[2], 10);
  let minutes = match[3] ? parseInt(match[3], 10) : 0;
  const period = match[1];

  if (text.includes('半')) minutes = 30;

  if (period === '下午' || period === '晚上') {
    if (hours < 12) hours += 12;
  } else if (period === '上午' || period === '早上') {
    if (hours === 12) hours = 0;
  }

  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes, matched: match[0] };
}

export function parseDate(input: string, refDate: Date = new Date()): DateParseResult | null {
  const text = input.toLowerCase().trim();
  let date: Date | null = null;
  let matchedText = '';
  let hasExplicitTime = false;

  const ref = new Date(refDate);

  // --- English relative days ---

  if (/\btonight\b/.test(text)) {
    date = new Date(ref);
    date.setHours(21, 0, 0, 0);
    matchedText = 'tonight';
    hasExplicitTime = true;
  } else if (/\btoday\b/.test(text)) {
    date = new Date(ref);
    matchedText = 'today';
  } else if (/\btomorrow\b/.test(text)) {
    date = new Date(ref);
    date.setDate(date.getDate() + 1);
    matchedText = 'tomorrow';
  } else if (/\bday after tomorrow\b/.test(text)) {
    date = new Date(ref);
    date.setDate(date.getDate() + 2);
    matchedText = 'day after tomorrow';
  }

  // --- "in X hours/minutes/days" ---
  if (!date) {
    const relMatch = text.match(/\bin\s+(\d+)\s*(hour|hr|minute|min|day|week)s?\b/);
    if (relMatch) {
      date = new Date(ref);
      const amount = parseInt(relMatch[1], 10);
      const unit = relMatch[2];
      if (unit.startsWith('hour') || unit === 'hr') {
        date.setHours(date.getHours() + amount);
      } else if (unit.startsWith('min')) {
        date.setMinutes(date.getMinutes() + amount);
      } else if (unit === 'day') {
        date.setDate(date.getDate() + amount);
      } else if (unit === 'week') {
        date.setDate(date.getDate() + amount * 7);
      }
      matchedText = relMatch[0];
      hasExplicitTime = unit.startsWith('hour') || unit.startsWith('min');
    }
  }

  // --- "next Monday", "this Friday" ---
  if (!date) {
    const dayMatch = text.match(/\b(?:next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/);
    if (dayMatch) {
      const targetDay = DAY_NAMES[dayMatch[1]];
      if (targetDay !== undefined) {
        date = new Date(ref);
        const currentDay = date.getDay();
        let daysAhead = targetDay - currentDay;
        if (daysAhead <= 0) daysAhead += 7;
        date.setDate(date.getDate() + daysAhead);
        matchedText = dayMatch[0];
      }
    }
  }

  // --- Bare day name: "Monday", "Friday" (treated as next occurrence) ---
  if (!date) {
    const bareDayMatch = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/);
    if (bareDayMatch) {
      const targetDay = DAY_NAMES[bareDayMatch[1]];
      if (targetDay !== undefined) {
        date = new Date(ref);
        const currentDay = date.getDay();
        let daysAhead = targetDay - currentDay;
        if (daysAhead <= 0) daysAhead += 7;
        date.setDate(date.getDate() + daysAhead);
        matchedText = bareDayMatch[0];
      }
    }
  }

  // --- "January 15", "Jan 15", month/day ---
  if (!date) {
    const monthMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})\b/);
    if (monthMatch) {
      const month = MONTH_NAMES[monthMatch[1]];
      const day = parseInt(monthMatch[2], 10);
      if (month !== undefined && day >= 1 && day <= 31) {
        date = new Date(ref.getFullYear(), month, day);
        if (date < ref) date.setFullYear(date.getFullYear() + 1);
        matchedText = monthMatch[0];
      }
    }
  }

  // --- "1/15", "12/25" ---
  if (!date) {
    const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\b/);
    if (slashMatch) {
      const month = parseInt(slashMatch[1], 10) - 1;
      const day = parseInt(slashMatch[2], 10);
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        date = new Date(ref.getFullYear(), month, day);
        if (date < ref) date.setFullYear(date.getFullYear() + 1);
        matchedText = slashMatch[0];
      }
    }
  }

  // --- Chinese dates ---
  if (!date) {
    if (/今天|今晚/.test(input)) {
      date = new Date(ref);
      matchedText = input.match(/今天|今晚/)![0];
      if (/今晚/.test(input)) { date.setHours(21, 0, 0, 0); hasExplicitTime = true; }
    } else if (/明天/.test(input)) {
      date = new Date(ref);
      date.setDate(date.getDate() + 1);
      matchedText = '明天';
    } else if (/后天/.test(input)) {
      date = new Date(ref);
      date.setDate(date.getDate() + 2);
      matchedText = '后天';
    }
  }

  // --- Chinese "下周X" (next weekday) ---
  if (!date) {
    const zhDayMatch = input.match(/下(?:周|礼拜|星期)([\u4e00-\u9fff])/);
    if (zhDayMatch) {
      const targetDay = ZH_DAYS[zhDayMatch[1]];
      if (targetDay !== undefined) {
        date = new Date(ref);
        const currentDay = date.getDay();
        let daysAhead = targetDay - currentDay;
        if (daysAhead <= 0) daysAhead += 7;
        date.setDate(date.getDate() + daysAhead);
        matchedText = zhDayMatch[0];
      }
    }
  }

  if (!date) return null;

  // --- Apply time to the date ---
  const timeParsed = parseTime(text) || parseTimeZh(input);
  if (timeParsed) {
    date.setHours(timeParsed.hours, timeParsed.minutes, 0, 0);
    hasExplicitTime = true;
    if (matchedText && !matchedText.includes(timeParsed.matched)) {
      matchedText = `${matchedText} ${timeParsed.matched}`.trim();
    }
  } else if (!hasExplicitTime) {
    date.setHours(9, 0, 0, 0);
  }

  return { date, matchedText, hasExplicitTime };
}
