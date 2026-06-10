# 03 — Roadmap

The full build, phase by phase. Each phase lists its **goal**, the **steps**, **what you'll
learn** (since this is your first RN app), and **"done when"** criteria. We do one phase at a
time, explain as we go, write a journal entry, run it, then move on.

We're on the git branch `feature/cato-app`.

---

## Phase 0 — Foundations & first run
**Goal:** a blank Expo app that opens on a phone/simulator and says hello.

Steps:
1. Scaffold the Expo (TypeScript) project.
2. Understand the generated files (what each one is for).
3. Run it (`npx expo start`) and see it live.

You'll learn: project structure, how `npx expo start` works, Fast Refresh, the basic
`View`/`Text` components.

**Done when:** the app launches and shows a screen we edited.

---

## Phase 1 — App skeleton (navigation + theme)
**Goal:** the 3-tab shell with our cozy visual style.

Steps:
1. Add Expo Router and create the `(tabs)` layout: **Chat / Tasks / Habits**.
2. Create a small **theme** (colors, spacing, fonts) for the soft, healing look.
3. Placeholder screens so we can tab between them.

You'll learn: navigation, file-based routing, styling in React Native, reusable theme.

**Done when:** you can tap between three styled tabs.

---

## Phase 2 — Data layer
**Goal:** store and read tasks/habits/messages on the device.

Steps:
1. Set up `expo-sqlite` and create the tables from the data model.
2. Write small query helpers (add task, list tasks, add check-in, etc.).
3. A tiny shared store (Zustand) so screens stay in sync.

You'll learn: persistence, why we keep data on-device, separating "data code" from "UI code".

**Done when:** we can add a row in code and read it back after an app restart.

---

## Phase 3 — The chat screen (static cat)
**Goal:** the chat UI with the cat's personality — before any parsing.

Steps:
1. Build `ChatBubble`, the message list, the input bar, and quick-reply chips.
2. Wire messages to the database (history persists).
3. Add the cat persona module with bilingual canned replies.

You'll learn: lists (`FlatList`), controlled inputs, components & props, keyboard handling.

**Done when:** you can chat back and forth with canned cat replies, and history survives restart.

---

## Phase 4 — Understanding, part A: the contract + rule fallback (EN + 中文)
**Goal:** the cat understands common sentences with **zero backend** — and this becomes our
offline safety net.

Steps:
1. Define the `Parser` interface and `ParseResult` type (the contract everything depends on).
2. Build the rule-based parser: language detect → intent → date extraction (chrono-node)
   → deadline/fixed-time → clean title.
3. Connect chat → parser → database → cat reply.

You'll learn: interfaces/contracts, why we abstract the parser, working with dates/timestamps.

**Done when:** typing "remind me to call mom tomorrow at 5pm" (or 中文) creates a real task
and the cat confirms in the right language — all on-device.

---

## Phase 4b — Understanding, part B: the LLM brain (the magic)
**Goal:** make the cat genuinely smart and bilingual via an LLM, with graceful fallback.

Steps:
1. Build the **tiny serverless backend** (`server/api/parse`) that holds the API key and
   calls the LLM with **function-calling** to return our `ParseResult` JSON. (OpenAI default,
   Anthropic-swappable.)
2. Build `llmParser.ts` in the app to call that backend.
3. Make `parser/index.ts` a **hybrid**: try LLM → on no-network/failure, fall back to rules.
4. Normalize whatever date the LLM returns through chrono for safety.

You'll learn: client/server boundary, keeping secrets off-device, function-calling/structured
output, graceful degradation.

**Done when:** casual + mixed-language input ("提醒我 tomorrow 给妈妈打电话") is understood
correctly, and pulling Wi-Fi makes it fall back to rules instead of breaking.

---

## Phase 5 — Reminders (notifications)
**Goal:** the phone actually buzzes with the cat's reminder.

Steps:
1. Request notification permission (explained gently in-app).
2. Schedule a local notification when a task is created; save its id.
3. Cancel on complete/delete. Deadline = advance nudge; fixed-time = on time.

You'll learn: permissions, scheduling system notifications, the app/OS boundary.

**Done when:** a task set for 2 minutes from now fires a cat notification.

---

## Phase 6 — Habits & streaks
**Goal:** check in habits via chat and watch streaks grow.

Steps:
1. Create/track habits; check in from chat ("check in reading" / "打卡看书").
2. Streak calculation + the habits screen (today's pending, streak counts).
3. Celebratory cat replies at milestones.

You'll learn: deriving values from data (streaks), date math, keeping UI in sync with data.

**Done when:** checking in increments today's habit and the streak count is correct.

---

## Phase 7 — Personalization & gift touches
**Goal:** make it unmistakably *hers*.

Steps:
1. Settings: her name, the cat's name, preferred language, theme color.
2. Personalized greeting and affectionate copy in both languages.
3. Optional special dates (anniversary/birthday) the cat remembers.

You'll learn: settings persistence, theming, conditional/templated copy.

**Done when:** the app greets her by name and the cat has the name she chose.

---

## Phase 8 — Polish & delivery to her iPhone
**Goal:** a finished gift on her actual phone.

Steps:
1. App icon, splash screen, the cat artwork, app name.
2. Empty states, error handling, little animations.
3. Build with EAS and deliver via **TestFlight** (decide on Apple Developer account).

You'll learn: app assets, builds, TestFlight distribution.

**Done when:** she installs Cato from TestFlight and it just works.

---

## Later / optional (post-v1)
- **Lock-screen streak widget** — the one native iOS/Swift (WidgetKit) piece.
- **Recurring reminders** — "every 20 minutes", "every day at 9am", "every Monday." Requires repeating notification triggers and a `recurring` field on tasks so they auto-reschedule after firing.
- Snooze/edit from the notification, calendar heatmap, themes.
- **Conversational context** — LLM remembers recent messages so you can say "actually change that to 9pm" or "no 4pm instead" and it updates the existing task instead of creating a new one. Requires: sending recent chat history to the LLM as multi-turn messages, and a new `updateTask` intent kind.
- **Multi-intent** — handle multiple requests in one message ("remind me X and also Y").
- **Achievement system** — badges, rewards, unlockable cat skins (inspired by 喵计划).
- **Focus timer** — Pomodoro sessions with cat companionship (inspired by 喵时计 / Cat On Chair).
- **Data insights** — weekly/monthly productivity charts, habit heatmaps, streak visualization.
- **Widgets** — home screen and lock screen quick access for tasks and habits.
- **Calendar integration** — sync tasks to system calendar, reminders via system notifications.
- **Long-term memory** — cat remembers preferences, past conversations, special dates over time (inspired by SentiCat).
- **Voice input** — speak reminders instead of typing (inspired by 喵记多).
- **Siri integration** — "Hey Siri, tell Cato to remind me to ___." Uses iOS Shortcuts / SiriKit Intents so you can add tasks hands-free without opening the app. Requires a native module and Siri Intent definition.
- **Gamified habits** — fishing minigame, streak rewards, milestone celebrations.
- **Photo-to-tasks** — take a picture of handwritten notes, a whiteboard, or a journal page, and the LLM extracts tasks from it. Uses the phone camera + OpenAI's vision API (gpt-4o can read images). If it can't read the handwriting, it asks you to clarify instead of guessing wrong. Could also work with screenshots of texts/emails.
- **System integrations** — "wake me up at 9am" triggers an actual alarm, "call mom" opens the dialer, "play my playlist" opens Spotify, "set a timer for 20 min" creates a countdown. Uses iOS URL schemes and Intents to hand off to other apps. Each integration is a new `kind` the LLM can return (e.g. `setAlarm`, `openApp`).

## Our cadence
After each phase: it runs, we wrote a `journal/` entry, and `04-decisions.md` is updated if
we made a notable choice. Then we move to the next phase.
