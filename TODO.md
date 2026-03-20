# Pocket Money — TODO

Organised by strategic area, with specific tasks nested under each.

---

## 🏠 Family Management ← next up

**Goal:** Give parents full control over their family setup — members, kids, and settings.

- [ ] **Invite a second parent / carer** — email invite flow; invited user joins the family with Member role
- [ ] **Manage family members** — list current parents/carers, remove a member, change role (Admin ↔ Member)
- [x] **Edit kid profile** — update name, avatar, colour, and currency override from a single place (currently split across pages)
- [x] **Archive / deactivate a kid** — soft-delete so history is preserved when a child ages out
- [x] **Family settings page** — consolidate currency, pocket money day, and member management into one place

---

## 💰 Pocket Money & Transactions

**Goal:** Make the core earn/spend loop fast and reliable for parents and kids.

- [ ] **Integer amounts for non-dollar currencies** — when using coins/stars, forms should default to whole numbers
- [ ] **Currency plural handling** — correctly pluralise currency names where possible (e.g. "1 Sheep / 2 Sheep", "1 Mouse / 2 Mice"); allow parents to specify an optional plural form
- [x] **Guess currency name from emoji** — when parent picks an emoji, auto-suggest the currency name (e.g. ⭐ → "Star", 🪙 → "Coin", 🍕 → "Pizza")
- [ ] **Savings goal matching** — parents can optionally match kid contributions on goals
- [ ] **Onboarding flow** — smoother setup wizard: create family → choose currency → add kids → set pocket money → create first chore

---

## 🏦 Savings Goals

**Goal:** Give kids a concrete target to save towards; give parents an easy way to see and encourage progress.

- [x] **Basic CRUD** — create, list, update, delete a goal
- [ ] **Goal detail page** — large progress bar, current vs target, days remaining, contribute button
- [ ] **Manual contributions** — parent logs an amount added to the goal; auto-marks complete when target reached
- [x] **Goal cover image** — upload an inspirational photo (e.g. photo of the bike the kid wants)
- [x] **Savings pot link** — when linked to an account, offer to pull/sync current_amount from pot balance
- [x] **Goal matching** — parents can optionally pledge to match kid contributions (e.g. "I'll match 50%")
- [x] **Kid-facing goal view** — kids see all their goals with progress bars and cover images on the child dashboard

---

## ✅ Chores & Approvals

**Goal:** Keep the chore approval loop fast enough that parents actually use it daily.

- [ ] **Approval flow speed** — one-tap approve from push notification; reachable in under 10 seconds
- [ ] **Bulk approve** — approve multiple pending chores at once from the dashboard
- [ ] **Chore history** — view past completions and approval decisions per chore

---

## 🏆 Engagement & Rewards

**Goal:** Give kids reasons to keep coming back; give parents tools beyond money.

- [ ] **Achievements & badges** — auto-awarded milestones ('First $10 saved!', '10 chores completed'); parents can create custom badges
- [ ] **Family reward store** — parents create a store of privileges (screen time, choose dinner, stay up late) with point costs
- [ ] **Family leaderboard** — optional sibling competition for most chores this week
- [ ] **Wish list** — kids add items with prices; parents see saving progress; grandparents can give targeted gifts

---

## 📱 Kid Experience

**Goal:** A dedicated view kids actually enjoy using.

- [ ] **Kid-facing app view** — dedicated child dashboard: balance hero, chore list, goal progress bar
- [ ] **Push notifications** — notify kids when a chore is approved ('You now have 450 coins!')
- [ ] **Age-appropriate money tips** nudged into the UI

---

## 📣 Communication & Sharing

**Goal:** Keep the family connected to the app between sessions.

- [ ] **Weekly email digest** — parents receive balances, chores done, upcoming goals
- [ ] **Printable goal cards** — kids can show grandparents their savings progress

---

## 🎨 Customisation & Upsell

**Goal:** Premium features that delight without being essential.

- [ ] **Dark mode / custom themes**
- [ ] **Seasonal badge packs**

---

## 🔧 Tech / Infrastructure

- [x] **Spender Create page** — add optional currency override (currently only on Edit)
- [ ] **PHPStan** — keep at level 5; run after every PHP change
