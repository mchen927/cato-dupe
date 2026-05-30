# 00 — Vision

## What Cato is

Cato is a **reminder + habit app that you talk to like a cute cat**. Instead of filling
out forms ("title", "date", "repeat: weekly"), you just type a sentence:

- "pay the electric bill by 6pm today"
- "明天早上七点去签证处"  (tomorrow 7am, go to the visa office)
- "remind me to call mom every Sunday"
- "check in reading"  /  "打卡看书"

The cat reads what you wrote, figures out what you meant, creates the reminder or logs the
habit, and replies with warmth and a little personality. Reminders arrive as **push
notifications that feel like the cat messaging you**.

## Who it's for

This is a **gift for my girlfriend**. That changes the design priorities:

- **It must feel personal and warm**, not corporate. The cat is affectionate and
  encouraging, never naggy or robotic.
- **It must be bilingual** — it understands and replies in **English and 中文**, because
  she switches between them. Bilingual support is a *core requirement*, not an add-on.
- **Small thoughtful touches matter**: her name, a custom cat name, maybe an anniversary
  reminder, gentle "you've got this" energy.
- Reliability over feature-count: a reminder that fails to fire ruins the magic. The few
  things it does, it should do dependably.

## The feel / personality

- Cozy, soft, "healing" aesthetic (the original 提醒猫 leans into this).
- The cat speaks like a supportive companion. Celebrates streaks, never guilt-trips.
- Bilingual replies that match the language you wrote in.

## Features

### MVP (what makes it real)
1. **Chat with the cat** — the main screen. Type naturally; the cat responds.
2. **Create reminders from natural language** (EN + 中文), including a date/time.
3. **Get reminded** — local notifications delivered as the cat.
4. **Track habits via chat** — "check in reading" logs a habit and counts your streak.
5. **A simple tasks view and habits view** so there's structure behind the chat.

### Nice-to-have (after MVP)
- Recurring reminders ("every Monday", "每周一").
- A home/lock-screen **streak widget** (this is the one native iOS/Swift piece — later).
- Themes / colors she can pick.
- Snooze, edit, and "done" from the notification.

### Gift touches (sprinkled in)
- Personalized greeting with her name and the cat's name.
- Optional special dates (anniversary, birthday) the cat remembers and celebrates.
- Encouraging, affectionate copy in both languages.

## Non-goals (for now)
- No accounts, login, or cloud sync in the MVP — everything lives **on her phone**.
- No Android build initially (we target **iOS**), though our stack keeps Android possible.
- No social/sharing features.

## What "done" looks like for v1
She opens Cato on her iPhone, types "remind me to take vitamins at 9am tomorrow" (or the
Chinese equivalent), the cat confirms sweetly, and at 9am the next day her phone buzzes
with a message from the cat. She can also "check in" a habit and watch her streak grow.
