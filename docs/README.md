# Cato — Build & Learning Journal

This folder is the **brain** of the project. It's written for someone building their
**first React Native app**, so every doc explains not just *what* we do but *why* we do
it, what each piece is, and the decisions behind it.

We build Cato as a **gift**: a friendly, bilingual (English + 中文) reminder + habit cat.

## How to read these docs

Read them in order the first time:

| Doc | What it covers |
|-----|----------------|
| [`00-vision.md`](./00-vision.md) | What we're building and why. The gift, the feel, the features. |
| [`01-how-mobile-apps-work.md`](./01-how-mobile-apps-work.md) | Beginner primer: native vs cross-platform, React Native, Expo, how the app runs on a real iPhone. |
| [`02-architecture.md`](./02-architecture.md) | The tech stack, folder layout, data model, the bilingual parser, and how the pieces fit. |
| [`03-roadmap.md`](./03-roadmap.md) | The full build, phase by phase, with what you'll learn and "done" criteria for each. |
| [`04-decisions.md`](./04-decisions.md) | A running log of every meaningful decision and the reasoning behind it. |
| [`journal/`](./journal/) | One short entry per build step: what we did, why, and what was new. |

## The working method

1. We pick the next step from the roadmap.
2. Before writing code, I explain the plan for that step and the concepts involved.
3. We write the code together, and I narrate *why* each part exists.
4. We add a short journal entry capturing what was learned.
5. We run it, see it work, then iterate.

Nothing is a black box. If a term shows up that you don't know, it's either explained
inline or in the glossary at the bottom of `01-how-mobile-apps-work.md`.
