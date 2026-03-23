# mobile/CLAUDE.md

## Overview

Expo React Native app for Quiddo. Shares a Laravel backend with the Inertia.js web app. Uses Expo Router for file-based navigation, TanStack Query for server state, and MMKV for local persistence.

## Navigation Structure (Expo Router)

```
mobile/app/
├── _layout.tsx                 ← Root layout: QueryClientProvider, AuthProvider, font loading
├── (auth)/                     ← Unauthenticated routes
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   └── reset-password.tsx
├── (app)/                      ← Authenticated routes (redirect to login if no token)
│   ├── _layout.tsx             ← Tab navigator
│   ├── (tabs)/
│   │   ├── _layout.tsx         ← Bottom tab bar
│   │   ├── index.tsx           ← Dashboard (parent or child view)
│   │   ├── kids/
│   │   │   ├── index.tsx       ← Spenders list
│   │   │   └── [id].tsx        ← Spender detail (accounts, goals, chores, transactions tabs)
│   │   ├── chores/
│   │   │   ├── index.tsx       ← Chores list (approval, schedule, manage tabs)
│   │   │   └── [id].tsx        ← Chore detail / edit
│   │   ├── goals/
│   │   │   └── index.tsx       ← Savings goals list
│   │   └── pocket-money/
│   │       └── index.tsx       ← Pocket money release
│   ├── accounts/
│   │   ├── [id].tsx            ← Account detail with transactions
│   │   └── create.tsx          ← Create account
│   ├── transactions/
│   │   ├── create.tsx          ← Add transaction
│   │   └── transfer.tsx        ← Transfer between accounts
│   ├── goals/
│   │   ├── [id].tsx            ← Goal detail
│   │   └── create.tsx          ← Create goal
│   ├── chores/
│   │   └── create.tsx          ← Create chore
│   ├── kids/
│   │   ├── create.tsx          ← Add kid
│   │   └── [id]/
│   │       └── edit.tsx        ← Edit kid (pocket money, chore rewards)
│   ├── family/
│   │   ├── index.tsx           ← Family settings
│   │   └── [id].tsx            ← Family detail
│   ├── settings.tsx            ← User settings
│   └── billing.tsx             ← Billing / subscription management
```

## State Management

- **Server state:** TanStack Query (`@tanstack/react-query`). All API data fetched via query hooks. Mutations use optimistic updates.
- **Auth token:** Stored in Expo SecureStore. Injected into axios via interceptor.
- **Local preferences:** MMKV (`react-native-mmkv`). Used for active family ID, UI preferences, cached user info.
- **No Redux, no Zustand.** TanStack Query + MMKV covers all needs.

## API Client

Located at `mobile/lib/api.ts`. Axios instance configured with:
- Base URL from `EXPO_PUBLIC_API_URL` environment variable
- Bearer token from SecureStore on every request
- 401 interceptor: clears token, navigates to login

Query hooks live alongside their screens or in `mobile/lib/api/` (one file per resource domain).

## Mobile-Specific Rules

1. **FlashList, not FlatList.** Use `@shopify/flash-list` for every list. Never use React Native's built-in FlatList.
2. **Reanimated, not Animated.** Use `react-native-reanimated` for every animation. Never use the built-in Animated API.
3. **Haptics on significant interactions.** Use `expo-haptics` `ImpactFeedbackStyle.Light` on: chore approval, chore decline, transaction add, goal completion, pocket money release.
4. **Skeleton screens, not spinners.** Loading states use grey placeholder shapes at correct dimensions. Never show a spinner.
5. **Optimistic updates on all mutations.** Update UI immediately via TanStack Query cache, roll back on failure.
6. **No personal data in push notification payloads.** Notification body must not contain names, amounts, or account details. Use generic text and let the app fetch details when opened.
7. **Kid view uses nightsky theme.** Background #081828, balance in wattle #E8A030.
8. **Earn amounts always in gumleaf #2A9E5C. Spend amounts always in redearth #C8483C.** These are semantic and must never be swapped or repurposed.
9. **Import types from `@quiddo/shared`.** Never define API response types locally.
10. **No Firebase SDK.** Push notifications are delivered by Laravel calling FCM/APNs HTTP APIs directly. The app only registers device tokens.
