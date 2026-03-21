# Pocket Money — TODO

Organised by strategic area, with specific tasks nested under each.

---
## Dashboard improvements

 - [x] Remove Dashboard title - it's already obvious
 - [x] Move kid carousel to top above totals
 - [x] Make the kid cards larger - left justify avatar, name at top
 - [x] Add quick add quick +/- transaction buttons to each kid card, with a modal that easily lets you add a transaction in minimal clicks

## 🏠 Family Management

**Goal:** Give parents full control over their family setup — members, kids, and settings.

- [x] When creating a new family, allow multiple kids to be added at once, along with their colour. In this view, the colour selection should be a hovering dropdown or modal. Don't worry about submitting each one as they go, just submit all kids once they're done.
- [x] Add a menu item for Spenders that lists all kids in a rich table, with their balances, closest goal, and how many of today's jobs are complete
- [x] **Invite a second parent / carer** — email invite flow; invited user joins the family with Member role
- [x] **Manage family members** — list current parents/carers, remove a member, change role (Admin ↔ Member)
- [x] **Edit kid profile** — update name, avatar, colour, and currency override from a single place (currently split across pages)
- [x] **Archive / deactivate a kid** — soft-delete so history is preserved when a child ages out
- [x] **Family settings page** — consolidate currency, pocket money day, and member management into one place

---

## 💰 Pocket Money & Transactions

**Goal:** Make the core earn/spend loop fast and reliable for parents and kids.

- [x] **Integer amounts for non-dollar currencies** — when using coins/stars, forms should default to whole numbers
- [x] **Currency plural handling** — correctly pluralise currency names where possible (e.g. "1 Sheep / 2 Sheep", "1 Mouse / 2 Mice"); allow parents to specify an optional plural form
- [x] **Guess currency name from emoji** — when parent picks an emoji, auto-suggest the currency name (e.g. ⭐ → "Star", 🪙 → "Coin", 🍕 → "Pizza")
- [x] Change 'Take' to 'Spend' on the kid cards on the dashboard

## UI Improvements

- [x] **Native emoji picker on mobile** — use system emoji keyboard on touch devices; JS picker on desktop; input can't be emptied (reverts to default)
- [x] **Onboarding flow** — smoother setup wizard: create family → choose currency → add kids → set pocket money → create first chore

---

## 🏦 Savings Goals

**Goal:** Give kids a concrete target to save towards; give parents an easy way to see and encourage progress.

- [x] **Basic CRUD** — create, list, update, delete a goal
- [x] **Goal detail page** — large progress bar, current vs target, days remaining
- [x] Show the closest goal on the dashboard
- [x] **Goal cover image** — upload an inspirational photo (e.g. photo of the bike the kid wants)
- [x] **Savings pot link** — when linked to an account, offer to pull/sync current_amount from pot balance
- [x] **Goal matching** — parents can optionally pledge to match kid contributions (e.g. "I'll match 50%")
- [x] **Kid-facing goal view** — kids see all their goals with progress bars and cover images on the child dashboard

---

## ✅ Chores & Approvals

**Goal:** Keep the chore approval loop fast enough that parents actually use it daily.

- [x] On the chores page, add filtering by which kid they're assigned to (including up for grabs), and sort by chronological order (and reverse)
- [ ] **Approval flow speed** — one-tap approve from push notification; reachable in under 10 seconds
- [x] **Bulk approve** — approve multiple pending chores at once from the dashboard
- [x] **Chore history** — view past completions and approval decisions per chore

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

- [x] **Kid-facing app view** — dedicated child dashboard: balance hero, chore list, goal progress bar
- [ ] **Push notifications** — notify kids when a chore is approved ('You now have 450 coins!')

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

## Chore Improvements
- [x] Ticking off a chore from the kids view (parent logged in) is throwing an error
- [x] It needs to be clearer which day a particular chore is for. There should be separate sections for setting up chores (often recurring) and a calendar of chores for today and future days.
- [x] The calendar view should be grouped by child.
- [x] The chore type (Responsibility, etc) should not have the hover effect on the chore list, but instead should have a tooltip that appears after a moment giving more information about that chore type. Refactor the text that defines each chore type into a file and make sure it's used wherever it's needed.
- [x] Parent should be able to unapprove chores that they've already approved. If undoing the chore approval would invalidate a payment that had already been made (eg. their pocket money responsibilities are no longer met, but pocket money has been paid) then the parent should get a notification about that payment and an option to cancel it.
-[ ] The Schedule tab of Chores should show which tasks have been marked as completed and/or approved for the current week.
- [ ] The Recent Activity section in the dashboard should give the option to unapprove the chores, as long as they were completed and approved in the current week.


## Pocket Money Improvements v1
- [x] We need to be able to set the recurring amount a child gets. It should be weekly or monthly, and be able to be any day of the week or month that actually triggers it. It can vary per kid.
- [x] We will need a background job that runs hourly to check whether pocket money is due, and if so , creates a transaction for it (as long as all responsibilities have been filled)
- [x] The parent should still be able to release pocket money that hasn't met responsibilities, but continues to be a manual action.
- [x] We should add a new type of payment - a reward that is based on a specific set of chores being completed. It's can optionally have a date that it will be paid out (in which case, if the responsibilities are completed, the transaction should be made automatically). If no date is set, it is paid out when the responsibilities are completed and approved.

## Miscellaneous Bugs v1
 - [x] The emoji picker on the family edit page should match the dark/light mode of the page. It's currently in dark mode.
 - [x] The pluralisation of the currency needs to be better - find and install a pluralisation library that will help.

## Infrastructure Stuff v1
 - [x] Enable Asset Prefetching through Vite
 - [x] Add Inertia link prefetching everywhere it makes sense
 - [x] Set up a Github action using https://github.com/marketplace/actions/deploy-to-laravel-cloud to deploy to Laravel Cloud only when all Pest and E2E tests pass. Do everything you can yourself, then add items to this TODO section for any additional configuration.
   - [ ] Add `LARAVEL_CLOUD_API_TOKEN` secret to the GitHub repo (Settings → Secrets → Actions)
   - [ ] Add `LARAVEL_CLOUD_APP_NAME` variable to the GitHub repo (Settings → Variables → Actions) with the exact application name from Laravel Cloud
