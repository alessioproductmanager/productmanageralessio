# Tiqets Supplier Tooling Hub — interview prototype (v2)

A working prototype built for a Junior Product Manager (B2B Supplier Tooling)
application at Tiqets. It simulates a channel-manager for cultural venues,
centered on two things a real supplier tool needs to nail: **fast product
creation/editing with a live preview**, and **live context for pricing**.

## Flow

1. **Staff badge login** (`js/login.js`) — a name and one of ten icons, no
   password. Every edit and push in the activity feed is signed with this.
2. **Onboarding quiz** (`js/quiz.js`) — three "boarding pass" steps: two
   knowledge checks about which cities have a Disney park, then a
   personalization step that reorders the destination list. Skippable;
   remembered per browser so returning visitors go straight to the hub.
3. **Product Hub** — a grid of Tiqets-style product cards per destination.
   - **Live pricing signals**: real live weather (Open-Meteo) + a mocked
     nearby-events feed + a "booking window" control, feeding a small
     rule-based pricing engine (`js/pricing.js`).
   - Click a card, or **"Add product"**, to open the editor: real editable
     fields (title, tagline, price, highlights, description, cancellation
     policy) next to a **live preview styled after a real Tiqets product
     page** (hero, rating, price box, included list, description,
     cancellation) that updates as you type. "Add product" also exposes
     Smart Ingestion — paste a URL, it detects a known destination and
     pre-fills the draft.
   - **Pricing assistant** inside the editor computes one concrete
     suggested price from the live signals, with an "Apply" button.
   - **Push panel**: after saving, push the product to every *connected*
     OTA channel (Tiqets, GetYourGuide, Viator, Klook, Expedia). Every
     edit and push is logged with who did it and when.
4. **Channel Sync** — connection toggles (mock OAuth) + the shared
   activity feed.
5. **API Monitoring** — simulated telemetry, labeled as such.
6. **PM Profile** — the CV / case-for-hire tab.

## The pricing logic is grounded in real practice

`js/pricing.js` cites this in-app (see the small note under "Live pricing
signals"). Three real, checkable facts shaped the rules:

- Museums and attractions (SFMOMA, MoPOP Seattle, Indianapolis Zoo) already
  run demand-based pricing tied to day, season and weather.
- Disney's own parks already vary published ticket prices by calendar date.
  The Empire State Building goes further and adjusts prices live with an
  algorithm that factors in demand, weather, time of day and nearby events —
  functionally the same signal set this dashboard uses.
- Framing matters: research on visitor acceptance found dynamic pricing
  lands much better presented as an off-peak saving than as a peak
  surcharge, and advance bookings are usually rewarded rather than
  penalized. The suggestion copy follows that framing.

## What's real vs. mocked

| Piece | Status |
|---|---|
| Weather (Open-Meteo) | **Real, live**, no API key needed |
| Nearby events | Mocked — small fixed dataset (`js/events.js`) |
| Smart Ingestion | Mocked — detects a destination name in the pasted URL text, doesn't scrape cross-origin |
| OTA OAuth connect / push | Mocked — no real GetYourGuide/Viator/Klook/Expedia credentials |
| API health telemetry | Simulated — labeled "demo only" in the UI |
| Login | Name + icon only, no password, no server — a label for the activity feed, not real auth |
| "Database" | `localStorage`, wrapped in `js/db.js` — persists in the browser only |

## Running it

No build step. Open `index.html` directly, or serve the folder:

```
npx serve venue-dashboard
```

Reset all demo state (login, quiz, catalog, connections, activity) from the
browser console: `App.DB.reset()` — or clear site data for the page.

## About the Hugging Face key

`App.CONFIG.HUGGINGFACE_TOKEN` in `js/db.js` is an a real token.

## Structure

```
index.html
css/  variables · base · layout · components · quiz · login · editor · animations
js/   db (config + mock persistence + activity log) · ui · login
      weather (real) · events (mock) · pricing (booking-window aware)
      ota (connections + push + activity feed) · apihealth (simulated)
      quiz · editor (cards + create/edit modal + live preview) · dashboard · app (bootstrap)
```
