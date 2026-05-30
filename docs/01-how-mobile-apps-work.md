# 01 — How mobile apps work (beginner primer)

You've never built a mobile app before, so this doc builds the mental model from scratch.
Nothing here is Cato-specific yet — it's the foundation everything else stands on.

## Two ways to build an iOS app

### 1. Native
Apple's "official" way: write the app in **Swift** using Apple's tools (Xcode). It only
runs on Apple devices. Android's official way is **Kotlin/Java**. If you wanted both
platforms natively, you'd write the app **twice**, in two languages.

### 2. Cross-platform
Write the app **once** in one language and a framework turns it into both an iOS app and
an Android app. **React Native** is the most popular of these.

We're using cross-platform (React Native) because:
- You write in **TypeScript** (one language), not Swift.
- It's the same React mental model used on the web, with a huge community.
- We can stay iOS-only for now but keep Android open for free.

## What is React Native?

React Native lets you describe your UI in **TypeScript/JSX**, and it renders **real native
iOS controls** under the hood (not a website pretending to be an app).

Key idea: you write components like

```tsx
<View>
  <Text>Hello</Text>
</View>
```

- `View` becomes a real iOS `UIView` (a container box).
- `Text` becomes a real iOS text label.

So you get native look-and-feel and performance, but you author it in TypeScript. Your
TypeScript runs inside a small JavaScript engine bundled into the app, and it "drives" the
native UI.

> **Web React vs React Native:** same concepts (components, props, state), different
> building blocks. On the web you use `<div>`/`<p>`; in React Native you use
> `<View>`/`<Text>`. There is no HTML or CSS files — styling is done in JS objects.

## What is Expo?

**Expo** is React Native **with batteries included**. Plain React Native makes you wire up
a lot of native tooling yourself. Expo gives you:

- **Ready-made native features as simple JS packages**: camera, notifications
  (`expo-notifications`), storage, etc. We don't have to touch Swift to use them.
- **A dev workflow**: run `npx expo start`, open the app on a phone, and edits appear
  almost instantly (this is called *Fast Refresh*).
- **Build services (EAS)**: turn our TypeScript project into a real installable iOS app.

We use Expo because it removes 90% of the painful setup for a first-time mobile dev.

## How do we actually see the app while building?

Three options, easiest → most "real":

1. **Expo Go** — a free app from the App Store. It loads our project over Wi-Fi so we can
   see changes live. Great for early development. Limitation: it can't run *custom native
   code*, so once we need certain native modules we move to option 2.
2. **Development build** — a custom version of our app (built once with EAS) that behaves
   like Expo Go but includes any native modules we need. This is the normal way to develop
   a "real" app.
3. **TestFlight / App Store** — Apple's official way to put the finished app on her iPhone.
   TestFlight is the beta channel; perfect for delivering a gift app to one person without
   a full App Store release.

We'll start in Expo Go (fast, zero setup on the phone) and graduate to a dev build /
TestFlight when needed.

> **Note:** building/installing on a *real iPhone* eventually needs an **Apple Developer
> account** ($99/yr) for TestFlight. For development we can use the iOS Simulator (on a Mac)
> or Expo Go (on her phone). We'll plan the delivery step carefully later.

## The building blocks we'll use a lot

| Concept | What it is | Cato example |
|---------|-----------|--------------|
| **Component** | A reusable piece of UI (a function returning JSX). | A chat bubble, a habit row. |
| **Props** | Inputs you pass into a component. | `<Bubble text="hi" fromCat={true} />` |
| **State** | Data that can change and re-renders the UI when it does. | The list of messages in the chat. |
| **Hook** | A function (name starts with `use`) that adds capabilities to a component. | `useState`, `useEffect`. |
| **Navigation** | Moving between screens / tabs. | Chat / Tasks / Habits tabs. |
| **Storage** | Saving data on the device so it survives app restarts. | Tasks & habits in a local database. |
| **Notifications** | System alerts scheduled to fire later. | The cat reminding her at 9am. |

## Glossary

- **iOS** — Apple's mobile operating system (iPhone).
- **Native** — code/UI provided directly by the OS (Swift on iOS).
- **React** — a popular library for building UIs from components and state.
- **React Native (RN)** — React, but it renders native mobile UI instead of web pages.
- **Expo** — a framework/toolkit on top of RN that bundles native features + tooling.
- **TypeScript (TS)** — JavaScript with types; catches mistakes before the app runs.
- **JSX/TSX** — the HTML-looking syntax inside JS/TS used to describe UI.
- **Component** — a function that returns a piece of UI.
- **Props** — inputs to a component.
- **State** — changeable data that, when changed, updates the UI.
- **Hook** — special `use*` function that plugs into React's features.
- **Package / dependency** — third-party code we install with `npm`.
- **npm / npx** — Node's package manager / package runner (how we install & run tools).
- **Simulator** — a fake iPhone on a computer for testing (Mac only).
- **Expo Go** — app that runs our project on a real phone during development.
- **EAS** — Expo's cloud build service that produces installable apps.
- **TestFlight** — Apple's beta-distribution app for installing pre-release apps.
- **WidgetKit** — Apple's framework (Swift) for lock/home-screen widgets. Native-only.
- **Component tree / render** — RN draws UI by "rendering" components top to bottom.
