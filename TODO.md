# Pocket Money — TODO

Organised by strategic area, with specific tasks nested under each.

---
## Dashboard improvements

 - [x] Remove Dashboard title - it's already obvious — completed 2026-03-20 22:33
 - [x] Move kid carousel to top above totals — completed 2026-03-20 22:33
 - [x] Make the kid cards larger - left justify avatar, name at top — completed 2026-03-20 22:33
 - [x] Add quick add quick +/- transaction buttons to each kid card, with a modal that easily lets you add a transaction in minimal clicks — completed 2026-03-20 22:33

## 🏠 Family Management

**Goal:** Give parents full control over their family setup — members, kids, and settings.

- [x] When creating a new family, allow multiple kids to be added at once, along with their colour. In this view, the colour selection should be a hovering dropdown or modal. Don't worry about submitting each one as they go, just submit all kids once they're done. — completed 2026-03-20 23:12
- [x] Add a menu item for Spenders that lists all kids in a rich table, with their balances, closest goal, and how many of today's jobs are complete — completed 2026-03-20 23:11
- [x] **Invite a second parent / carer** — email invite flow; invited user joins the family with Member role — completed 2026-03-20 23:17
- [x] **Manage family members** — list current parents/carers, remove a member, change role (Admin ↔ Member) — completed 2026-03-20 17:22
- [x] **Edit kid profile** — update name, avatar, colour, and currency override from a single place (currently split across pages) — completed 2026-03-20 20:07
- [x] **Archive / deactivate a kid** — soft-delete so history is preserved when a child ages out — completed 2026-03-20 20:13
- [x] **Family settings page** — consolidate currency, pocket money day, and member management into one place — completed 2026-03-20 17:22
- [x] Add an edit button to kid pages — completed 2026-03-22 11:03
- [x] When setting up a kid (in either onboarding or on edit page), provide a larger array of colours in various nice palettes. Have 10 visible like now, the rest in a popup that can be opened or expanded — completed 2026-03-22
- [x] Add a QR code flow, where another parent can use their device to scan the QR code and it will bring up the app/site and let them register and connect their account, same way an invite would — completed 2026-03-26
- [x] On kids page, Accounts tab - put 'Goals' header above the goal areas in each card — completed 2026-03-26
- [x] On any page (web or mobile) when selecting the emoji for the custom currency, the word used should be as specific as possible. eg. For the olive emoji the word should be 'olive', not 'food'. — completed 2026-03-26
- [x] Add a Kid (mobile): Needs all the options from the web version. Custom currency, photo, etc. — completed 2026-03-26
---

## 💰 Pocket Money & Transactions

**Goal:** Make the core earn/spend loop fast and reliable for parents and kids.

- [x] **Integer amounts for non-dollar currencies** — when using coins/stars, forms should default to whole numbers — completed 2026-03-21 00:20
- [x] **Currency plural handling** — correctly pluralise currency names where possible (e.g. "1 Sheep / 2 Sheep", "1 Mouse / 2 Mice"); allow parents to specify an optional plural form — completed 2026-03-21 00:20
- [x] **Guess currency name from emoji** — when parent picks an emoji, auto-suggest the currency name (e.g. ⭐ → "Star", 🪙 → "Coin", 🍕 → "Pizza") — completed 2026-03-20 18:02
- [x] Change 'Take' to 'Spend' on the kid cards on the dashboard — completed 2026-03-21 00:20
- [x] Add an account selector on the Add/Spend modals, and switch the currency as necessary based on selected account — completed 2026-03-21 14:30

## UI Improvements

- [x] **Native emoji picker on mobile** — use system emoji keyboard on touch devices; JS picker on desktop; input can't be emptied (rever ts to default) — completed 2026-03-20 22:53
- [x] **Onboarding flow** — smoother setup wizard: create family → choose currency → add kids → set pocket money → create first chore — completed 2026-03-21 16:31
- [x] On the kid view page, each account should have a Spend/Add button like those on the kid cards on the dashboard, and when clicked they bring up the same modal but with that account pre-selected — completed 2026-03-22 14:05
- [x] Let's try splitting the Kid view up into tabs - one for Accounts, one for Savings Goals, one for Chores, and a Transactions tab that aggregates transactions for all their accounts — completed 2026-03-22 14:09

---

## 🏦 Savings Goals

**Goal:** Give kids a concrete target to save towards; give parents an easy way to see and encourage progress.

- [x] **Basic CRUD** — create, list, update, delete a goal — completed 2026-03-20 18:11
- [x] **Goal detail page** — large progress bar, current vs target, days remaining — completed 2026-03-20 18:11
- [x] Show the closest goal on the dashboard — completed 2026-03-20 23:17
- [x] **Goal cover image** — upload an inspirational photo (e.g. photo of the bike the kid wants) — completed 2026-03-20 18:16
- [x] **Savings pot link** — when linked to an account, offer to pull/sync current_amount from pot balance — completed 2026-03-20 18:38
- [x] **Goal matching** — parents can optionally pledge to match kid contributions (e.g. "I'll match 50%") — completed 2026-03-20 18:41
- [x] **Kid-facing goal view** — kids see all their goals with progress bars and cover images on the child dashboard — completed 2026-03-20 18:43
- [x] Split goals page into Active Goals and Completed Goals. Goals that have been reached in the last week should stay on the Active page. — completed 2026-03-22 01:06
- [x] Add the ability to abandon a Savings Goal. Savings goals that were created in the past 24 hours can be fully destroyed rather than becoming and abandoned goal. — completed 2026-03-22 01:06
- [x] Add an Abandoned Goals page that is only visible if there are any abandoned goals. It should list any goals that have been removed before being reached, and should show the date they were originally created, the date they were abandoned, and how much money was attributed to them at the time of being abandoned. — completed 2026-03-22 01:06
- [x] Give parents the ability to completely destroy an abandoned goal. — completed 2026-03-22 01:06
- [x] On the Savings Goal page, I want the account sections to be more obvious. Make the headings clearer.
- [x] On the Kids page, order accounts by the amount of money in them, per kid
- [x] On the Accounts tab of the Kid specific page, change the Spend/Add button to be vertically stacked on the right side of each card, and add the savings goals to each card as well. — completed 2026-03-22
- [x] On the Goals tab, group the goals by account — completed 2026-03-22
- [x] On the Chores tab, add an edit button for each chore. If a chore hasn't been completed in the current time period (ie. today, if it's Daily; this week if it's weekly), show it as not done, even if there are completions from previous days. — completed 2026-03-22
- [x] When adding a new kid, we should add an account automatically with a name of 'Savings' — completed 2026-03-26
- [x] New Account (mobile): the child selection should be a rich dropdown showing their avatar and name — completed 2026-03-26
- [x] New Account (mobile): the currency options should be a dropdown, with the Dollars and Custom above a line as the most common, and then all the other options we have listed on the web version under the line — completed 2026-03-26
- [x] New Account (mobile): When custom is chosen as the currency, that's when we show the selection for an emoji (using the same emoji picker as the chores), and the singular and plural names. The singular and plural names need labels on their fields - small, above each field input. — completed 2026-03-26
- [x] New Goal (mobile): child selection should be the same rich dropdown as described above — completed 2026-03-26
- [x] New Goal (mobile): needs the account selection dropdown like the web version — completed 2026-03-26
- [x] New Goal (mobile): should have a way to set a cover photo, like the web version. Use the camera or pick from gallery. — completed 2026-03-26
- [x] New Goal (mobile): The currency symbol on Target Amount must use the currency selected for the selected account, including custom emoji currencies — completed 2026-03-26
- [x] View Savings Goal (mobile): If there's no cover image, remove the section that currently says 'No cover image' — completed 2026-03-26
- [x] View Savings Goal (mobile): Needs the full avatar next to the child's name — completed 2026-03-26

---

## ✅ Chores & Approvals

**Goal:** Keep the chore approval loop fast enough that parents actually use it daily.

- [x] On the chores page, add filtering by which kid they're assigned to (including up for grabs), and sort by chronological order (and reverse) — completed 2026-03-20 23:25
- [x] **Bulk approve** — approve multiple pending chores at once from the dashboard — completed 2026-03-20 23:28
- [x] **Chore history** — view past completions and approval decisions per chore — completed 2026-03-21 00:03
- [x] Mobile Add Chore page: move the Emoji picker to the right of the Chore Name field and shrink it a littler, remove the 'Tap to pick' and 'Clear' as it's no longer optional
- [x] Mobile Add Chore page: Stack the Reward types vertically, and add the subtitle to match the web version
- [x] Mobile Add Chore page: Put the frequency options into a 2x2 grid so they look more even
- [x] Mobile Add Chore page: Add a green check on the right hand side of kids that are assigned to a chore
- [x] Mobile Add Chore page: submitting a new chore throws a 'family_id is required' error
- [x] Mobile Add Chore page: missing the Up For Grabs option
- [x] Unless a chore is 'Up For Grabs', throw a verification error when no kids are selected when they try to submit (mobile and web)
- [x] On both web and mobile, on the Chores -> Manage tab, there should be more detail about the chore schedule. For weekly chores the day of the week, monthly chores the day of the month, and one-off chores the specific date. — completed 2026-03-26
- [x] Deleting a chore schedule should not delete the chore completions associated with it. We want historical data to stay intact. — completed 2026-03-26
---

## 📱 Kid Experience

**Goal:** A dedicated view kids actually enjoy using.

- [x] **Kid-facing app view** — dedicated child dashboard: balance hero, chore list, goal progress bar — completed 2026-03-20 19:51
- [x] Add button to go to kid-view for each kid on the Kids page — completed 2026-03-22 00:53
- [x] Anywhere we were previously showing the goal that was closest to completion, we should now show the goal that is at the top of their prioritised goal list. — completed 2026-03-22 00:53
- [x] On the kids page, if a kids has multiple accounts, show a card for each account with the amount in each and the current top prioritized goal for that account, with the progress bar, title and amount complete. — completed 2026-03-22 00:53
- [x] Wherever we are currently showing the amount complete for a savings goal, add the contributed and total currency for that goal as well. So "$5 of $10 (50%)" or "(star emoji)5 of (star emoji)20 (25%)" — completed 2026-03-22 00:53
- [x] On the kids page, make the goals clickable and have them take the user to the page for that goal — completed 2026-03-22 00:53
- [x] Everywhere we can, have the kid's name link to their page — completed 2026-03-22 00:53
- [x] Add a QR code flow, where a kid can use their device to scan the QR code and it will bring up the app/site and let them register and connect their account — completed 2026-03-26 (child-link.tsx + SpenderLinkCode)

---

## 🔧 Tech / Infrastructure

- [x] **Spender Create page** — add optional currency override (currently only on Edit) — completed 2026-03-20 20:13
- [x] **PHPStan** — keep at level 5; run after every PHP change — completed 2026-03-20 16:37
- [x] Add a new family to the seeders, still attached to the ben@example.com user. Seed data for that family in a way that will help test the scheduled tasks. So have some kids with pocket money due that should have a transaction added the next time the scheduled task is done, some that would have the transaction added but they haven't completed all their responsibilities, etc. — completed 2026-03-22

## Chore Improvements
- [x] Ticking off a chore from the kids view (parent logged in) is throwing an error — completed 2026-03-21 05:36
- [x] It needs to be clearer which day a particular chore is for. There should be separate sections for setting up chores (often recurring) and a calendar of chores for today and future days. — completed 2026-03-21 05:42
- [x] The calendar view should be grouped by child. — completed 2026-03-21 05:42
- [x] The chore type (Responsibility, etc) should not have the hover effect on the chore list, but instead should have a tooltip that appears after a moment giving more information about that chore type. Refactor the text that defines each chore type into a file and make sure it's used wherever it's needed. — completed 2026-03-21 05:37
- [x] Parent should be able to unapprove chores that they've already approved. If undoing the chore approval would invalidate a payment that had already been made (eg. their pocket money responsibilities are no longer met, but pocket money has been paid) then the parent should get a notification about that payment and an option to cancel it. — completed 2026-03-21 05:40
- [x] The Schedule tab of Chores should show which tasks have been marked as completed and/or approved for the current week. — completed 2026-03-22 00:46
- [x] The Recent Activity section in the dashboard should give the option to unapprove the chores, as long as they were completed and approved in the current week. — completed 2026-03-22 00:46
- [x] On the schedule tab of the chores page, above the 'Today' card, there should be a summary of the day before that shows how many chores were present/completed for each kid. Clicking it should open it into a full card like the 'Today', etc cards with the chores for that day.


## Pocket Money Improvements v1
- [x] We need to be able to set the recurring amount a child gets. It should be weekly or monthly, and be able to be any day of the week or month that actually triggers it. It can vary per kid. — completed 2026-03-21 10:43
- [x] We will need a background job that runs hourly to check whether pocket money is due, and if so , creates a transaction for it (as long as all responsibilities have been filled) — completed 2026-03-21 10:43
- [x] The parent should still be able to release pocket money that hasn't met responsibilities, but continues to be a manual action. — completed 2026-03-22 11:03
- [x] We should add a new type of payment - a reward that is based on a specific set of chores being completed. It's can optionally have a date that it will be paid out (in which case, if the responsibilities are completed, the transaction should be made automatically). If no date is set, it is paid out when the responsibilities are completed and approved. — completed 2026-03-21 10:50
- [x] The Pocket Money page right now isn't very useful. Change it to show the pocket money schedules of the different kids, and a history of pocket money specific transactions. If any kids have had pocket money withheld this week due to failed responsibilities, add a summary of why it was withheld and give the option to release it, either in part (as a percentage) or in full. — completed 2026-03-22 11:03

## Miscellaneous Bugs v1
 - [x] The emoji picker on the family edit page should match the dark/light mode of the page. It's currently in dark mode. — completed 2026-03-21 00:52
 - [x] The pluralisation of the currency needs to be better - find and install a pluralisation library that will help. — completed 2026-03-21 00:52

## Infrastructure Stuff v1
 - [x] Enable Asset Prefetching through Vite — completed 2026-03-21 21:17
 - [x] Add Inertia link prefetching everywhere it makes sense — completed 2026-03-21 21:17
 - [x] Set up a Github action using https://github.com/marketplace/actions/deploy-to-laravel-cloud to deploy to Laravel Cloud only when all Pest and E2E tests pass. Do everything you can yourself, then add items to this TODO section for any additional configuration. — completed 2026-03-21 21:17
   - [x] Add `LARAVEL_CLOUD_API_TOKEN` secret to the GitHub repo (Settings → Secrets → Actions) — completed 2026-03-21 21:17
   - [x] Add `LARAVEL_CLOUD_APP_NAME` variable to the GitHub repo (Settings → Variables → Actions) with the exact application name from Laravel Cloud — completed 2026-03-21 21:17

## App Identity and Marketing
 - [x] The app is now named "Quiddo" - a combination of "Quid" and "Kiddo". Replace all uses of "Pocket Money" as an app name with "Quiddo". Make sure not to replace elements where pocket money is referring to the general concept rather than the name of the app. — completed 2026-03-21 21:24
 - [x] Pricing is changing to AUD$1.99 a month per family, with each family being up to 12 kids. Annual pricing is AUD$15 a year if you pay annually. Figure out what the percentage saving is there and make sure that's part of the marketing copy. — completed 2026-03-21 21:24
 - [x] Update the landing page. Remove any stats about how many users we have as we're only just launching. We want the copy to focus on the simplicity and ease of use of the app, especially compared to other apps that give kids their own debit cards and require adults to mess with separate accounts. — completed 2026-03-21 21:24
 - [x] Implement the landing page available at /home/ben/Downloads/quiddo-landing.html and replace the existing set of marketing pages — completed 2026-03-22

## Mobile App improvements
**These apply to the site when in a mobile viewport, either from the website or embedded in the Capacitor app**
- [x] Add space at the top of the viewport for cutouts and icons — completed 2026-03-22 11:32
- [x] Back swipe currently closes the app rather than going back — completed 2026-03-22 11:32
- [x] Move the login components higher up the screen so they don't get cut off by the native keyboard — completed 2026-03-22 11:32
- [x] Hook into the native camera components where available and add a 'Take a photo' button where we currently have the ability to upload a photo — completed 2026-03-22 11:32
- [x] Instead of the hamburger menu on mobile, let's go for the classic row of buttons along the bottom. Buttons should be: Dashboard, Kids, Chores, Goals, Pocket Money — completed 2026-03-22 11:32
- [x] The Add/Spend modals currently overlap the native keyboard a bit by default unless you scroll. See if you can make them fixed higher on the page on mobile. — completed 2026-03-22 11:32

## Billing Improvements
- [x] **Billing ownership transfer** — Allow the billing owner of a family to transfer billing responsibility to another carer via an email invite. The receiving carer must accept from their email before the transfer takes effect. — completed 2026-03-23 01:15

# FOR LATER. Don't tackle anything below here without explicit instructions.

## React Native Rebuild TODO

- [x] **Font files** — Fraunces and DM Sans need to be added to `mobile/assets/fonts/` and loaded in root layout
- [x] **Tab icons** — Tab bar icons need to be configured (Lucide or SF Symbols)
- [ ] **Push notifications** — `device_tokens` migration and model needed when implementing FCM/APNs delivery from Laravel
- [ ] **`match_percentage`** — Savings goal parent matching exists in schema but has no UI or logic yet
- [x] **Capacitor removal** — Root still has Capacitor deps (`@capacitor/core`, `@capacitor/cli`); remove if mobile replaces it
- [ ] **Start Sail** — API routes can't be verified until `sail up -d` is running
- [ ] **Environment variable** — `EXPO_PUBLIC_API_URL` needs to be set for the mobile app to connect to the Laravel API
- [ ] **Sanctum config** — May need `config/sanctum.php` published if token auth doesn't work out of the box

---

## 🏆 Engagement & Rewards

**Goal:** Give kids reasons to keep coming back; give parents tools beyond money.

- [ ] **Achievements & badges** — auto-awarded milestones ('First $10 saved!', '10 chores completed'); parents can create custom badges
- [ ] **Family reward store** — parents create a store of privileges (screen time, choose dinner, stay up late) with point costs
- [ ] **Family leaderboard** — optional sibling competition for most chores this week
- [ ] **Wish list** — kids add items with prices; parents see saving progress; grandparents can give targeted gifts

---

## 🎨 Customisation & Upsell

**Goal:** Premium features that delight without being essential.

- [ ] **Dark mode / custom themes**
- [ ] **Seasonal badge packs**
---

## 📣 Communication & Sharing

**Goal:** Keep the family connected to the app between sessions.

- [ ] **Weekly email digest** — parents receive balances, chores done, upcoming goals
- [ ] **Printable goal cards** — kids can show grandparents their savings progress
- [ ] Push notifications - implement laravel-notification-channels/fcm for Android and laravel-notification-channels/apn for Apple

## Infrastructure and Privacy
 - [ ] Encrypt certain fields at the database layer using Laravel's encrypted cast. Kid's names, parent names, stripe IDs, etc. Don't do this until we have a proper key rotation and backup strategy in place - losing the key means all that data is gone.

- [ ] **Facebook login** — re-add `react-native-fbsdk-next` once real Facebook App credentials are set up (App ID + Client Token from developers.facebook.com). Restore plugin in `mobile/app.json` and Facebook button in `mobile/components/SocialLoginButtons.tsx`.
