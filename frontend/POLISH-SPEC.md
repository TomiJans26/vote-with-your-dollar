# DollarVote Frontend Polish — CLI Build Spec

## Goal
Make DollarVote so stupidly simple that any human can use it without thinking. Dave is testing in the morning.

## Changes Required

### 1. Remove Beta Gate (BetaGate.jsx)
- DELETE the BetaGate component wrapping in App.jsx
- We're going public. No more beta codes.
- Keep the file but don't use it (in case we want it back)

### 2. Simplify Scanner Page (Scanner.jsx) — This is the HOME page
- Make search the PRIMARY action, not scanning. Most people don't know what a UPC is.
- Big friendly search bar at top: "Search for a product or brand..."
- Scan button should be secondary (smaller, below search)
- Remove manual UPC entry section entirely — confusing for normal humans
- Replace example UPC numbers with example PRODUCT NAMES as clickable chips:
  - "Coca-Cola" → navigate to /result/049000006346
  - "Tostitos" → navigate to /result/028400064057  
  - "Kellogg's" → navigate to /result/038000138416
  - "Pepsi" → navigate to /result/012000001536
- Add a brief tagline: "See where your money really goes"

### 3. Simplify Onboarding (Onboarding.jsx)
- Make it SHORTER. 2 steps max instead of whatever it is now.
- Step 1: "What issues matter to you?" (quick checkbox grid)
- Step 2: Done. Start scanning.
- Option to skip entirely: "Skip — show me everything"
- Save the detailed belief profile stuff for Settings

### 4. Make Registration Optional
- Let people USE the app without registering
- Scanning, searching, viewing results = no account needed
- Registration only needed for: saving history, shopping list, syncing across devices
- In App.jsx: Remove RequireAuth/RequireVerified guards from main pages
- Keep them only for /list, /history, /settings

### 5. Result Page (Result.jsx) — Make the Value Proposition Obvious
- The alignment score should be BIG and colorful (red/yellow/green)
- "This company donated $X to [causes you care about]" in plain English
- Alternatives section should be prominent: "Try these instead:"
- Each alternative should show its score prominently
- Add share button (native share API or copy link)

### 6. Layout/Navigation (Layout.jsx)
- Bottom nav should be: Search (home) | Explore | List | Settings
- Remove History from bottom nav (put it in Settings)
- Keep it to 4 tabs max — less is more

### 7. Overall Polish
- Remove any loading states that feel slow — add skeleton screens instead
- All buttons should have active/pressed states (feels responsive)
- Error messages should be helpful, not technical
- No "undefined" or blank screens ever

### 8. PWA Stuff
- Make sure the app installs cleanly on mobile
- App name: "DollarVote"
- Theme color: teal/emerald

## DO NOT CHANGE
- The API layer (lib/api.js) — backend is working, don't touch it
- The backend URL or auth flow internals
- Admin pages (Admin.jsx, AdminLogin.jsx)
- Terms and Privacy pages

## Tech Notes
- Framework: React + Vite
- Styling: Tailwind CSS
- Router: react-router-dom
- To test: cd frontend && npm run dev
