# 04 — Decision log

A running record of meaningful choices and *why* we made them. Newest at the bottom. When
we change our mind later, we add a new entry rather than deleting history — so the reasoning
is always traceable.

Format: **Decision** · **Context** · **Why** · **Alternatives considered**.

---

### D1 — Build Cato, not momo
- **Context:** Two reference apps: momo (lock-screen quick-capture) and Cato (chat AI cat).
- **Decision:** Build **Cato**.
- **Why:** Its core (chat + reminders + habits) works as a normal cross-platform app and is
  the more unique, giftable hook. momo's value *is* the iOS lock-screen widget, which is
  native-Swift-only and a much steeper first project.
- **Alternatives:** momo (rejected for now — native-heavy, less personal as a gift).

### D2 — Target iOS, build with Expo (React Native) + TypeScript
- **Context:** First-ever mobile app; gift is for an iPhone user.
- **Decision:** Expo + RN + TS, shipped to iOS.
- **Why:** Easiest on-ramp for a beginner, one language, great docs/community, and Android
  stays possible for free. Going fully native Swift would be a harder first project.
- **Alternatives:** Native Swift (too steep), Flutter (new language, Dart).

### D3 — Bilingual (English + 中文) is a core requirement
- **Context:** She switches between English and Chinese.
- **Decision:** Understand and reply in both, matching the language she wrote in.
- **Why:** It's a gift for her specifically; bilingual is the point, not a nice-to-have.
- **Impact:** Shapes the parser design and all persona copy.

### D4 — Parser hidden behind an interface; start rule-based, LLM later
- **Context:** Understanding messy bilingual sentences is the hard part.
- **Decision:** Define a `Parser` interface; first implementation is **rule-based**
  (chrono-node + keyword rules). Keep an **LLM** implementation as a drop-in upgrade.
- **Why:** Rule-based ships fast with **no backend, no API key, offline, private**, and
  teaches the data flow. The interface means we can upgrade to an LLM with zero changes to
  the rest of the app if accuracy isn't good enough.
- **Alternatives:** LLM-first (rejected initially — needs a backend/key/cost before we even
  have a working app).

### D5 — On-device only for v1 (no accounts/cloud)
- **Context:** Single user (her), simplicity, privacy.
- **Decision:** Store everything locally with `expo-sqlite`; no login/sync in v1.
- **Why:** Less to build, nothing to secure server-side, fully private, works offline.
- **Alternatives:** Cloud sync/accounts (deferred; only needed for multi-device).

### D6 — Documentation-driven, explain-everything workflow
- **Context:** First RN app; learning is an explicit goal.
- **Decision:** Maintain `docs/` (vision, primer, architecture, roadmap, this log) and a
  per-step `journal/`. Explain the *why* before writing code each step.
- **Why:** Turns the build into a guided learning experience and keeps decisions traceable.

### D7 — LLM-hybrid understanding (updates D4)
- **Context:** Bilingual (esp. Chinese) + casual + conversational understanding is the core
  magic of the gift, and it's exactly where pure rules are weakest.
- **Decision:** Make the **LLM the brain** for intent + meaning, keep **chrono-node** for
  date math, and keep a **rule-based fallback** for when there's no network. Still all behind
  the one `Parser` interface from D4.
- **Why:** Delivers the "wow" (handles bilingual/messy/mixed-language input ~95%+), while the
  fallback means a dropped connection degrades gracefully instead of failing.
- **Cost accepted:** a tiny serverless backend to hold the API key (never in the app), a few
  pennies of usage for one user, ~1s latency, and internet needed to *parse* (reminders still
  fire offline once created).
- **Supersedes:** D4's "start rule-based, LLM later" sequencing. The interface design from D4
  stays exactly the same — only the order/primary implementation changed.

### D8 — Default to OpenAI, provider-swappable
- **Context:** Need to pick an LLM provider; user is fine with either.
- **Decision:** Default to **OpenAI** in the backend, written so **Anthropic** is a drop-in
  swap. The app only talks to *our* backend, never the provider directly.
- **Why:** OpenAI is the most ubiquitous/easiest to start; isolating it in the backend means
  changing providers never touches the app.

<!-- Add new decisions below as we make them. -->
