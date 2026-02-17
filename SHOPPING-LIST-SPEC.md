# Shopping List Feature — Product Spec

> "We will never take profit over values. In any circumstance. Ever."

## The Concept
Users don't just scan one product — they have a whole cart. We learn their habits, their values, and their preferred store. Then we curate a complete shopping list of value-aligned products they can pick up TODAY.

## User Flow

### Phase A: Learn Habits
1. User scans products they normally buy (Tostitos, Tide, Folgers, etc.)
2. Each scan → we show alignment + alternatives
3. If they pick an alternative → **track that preference**
4. Over time: "Dave usually buys chips, laundry detergent, coffee, cat food"

### Phase B: Build the List
1. User opens "My List" tab
2. Sees their regular products with alignment scores
3. Low-scoring items flagged: "🔄 Swap available — 78% aligned alternative"
4. One tap to swap → alternative slides in
5. Each item shows: product name, alignment %, price (if available), store availability

### Phase C: Checkout by Store
User picks their store preference:

#### 🏪 "Get it today" — Safeway/Kroger/Walmart/Target
- Entire list filtered to what's available at their local store
- **Kroger API** → check stock at nearest Safeway/Fred Meyer/QFC
- **"Confirm list → Free pickup"** button
- We earn affiliate revenue on every item in the curated list
- User pays NOTHING extra — same prices as walking in

#### 📦 "Order online" — Amazon
- Full list with Amazon affiliate links
- "Order all" → opens Amazon cart with our affiliate tag
- Arrives tomorrow (Prime) or 2-day

#### 🛒 "I'm in the store now" — Aisle Guide
- Checklist mode: tap items as you grab them
- Sort by aisle/category
- "Scan to verify" — scan the barcode to confirm it's the right product

## Data We Track (with permission)

### User Shopping Profile
- **Regular items**: what they scan/buy repeatedly
- **Swaps made**: which alternatives they chose
- **Store preference**: Safeway, Kroger, Amazon, etc.
- **Shopping frequency**: weekly? biweekly?
- **Category patterns**: heavy on snacks? lots of cleaning products?

### Aggregate Insights (anonymized)
- "73% of users who scanned Tide switched to Seventh Generation"
- "Frito-Lay is the most-scanned brand with the lowest swap rate" (brand loyalty is STRONG)
- "Users who set 'climate change' as a deal breaker buy 40% more organic products"
- THIS data is gold for brands who want to understand value-driven consumers

## Revenue Per Transaction

| Store | How We Earn | Estimated Rate |
|-------|-------------|----------------|
| Amazon | Affiliate tag on every item | 4-8% per item |
| Kroger/Safeway | Kroger affiliate program | TBD — need to verify |
| Walmart | Walmart affiliate program | 1-4% per item |
| Target | Target affiliate program | 1-4% per item |
| Independent | "Find in store" — no revenue | $0 (values > money) |

### The Math
- Average grocery cart: $100-150/week
- If we curate even 30% of that cart: $30-45 in affiliate-linked products
- At 4% average commission: **$1.20-1.80 per user per week**
- 10,000 weekly active users: **$12,000-18,000/week**
- That's $50K-75K/month from shopping lists alone

## Onboarding Clarity (Dave's Request)
The profile setup MUST be crystal clear about what it's for:

### Before onboarding:
> "Your values profile helps us find products aligned with what YOU believe in.
> We'll use your preferences to:
> ✅ Score companies against YOUR values
> ✅ Suggest better alternatives when you scan products  
> ✅ Build personalized shopping lists at your preferred store
> 
> We NEVER sell your data. We NEVER let revenue influence recommendations.
> Your values come first. Always."

### After onboarding:
> "Profile saved! Now scan any product to see how it aligns with your values."

## Shopping List UX

### The List View
```
┌─────────────────────────────────────┐
│  🛒 My Shopping List          [Edit]│
│  12 items · Safeway (Division St)   │
├─────────────────────────────────────┤
│  ✅ Kirkland Tortilla Chips    78%  │
│     swapped from Tostitos (52%)     │
│                                     │
│  ✅ Seventh Generation Detergent 85%│
│     swapped from Tide (41%)         │
│                                     │
│  ⚠️ Folgers Coffee             38%  │
│     🔄 Try: Counter Culture    82%  │
│     [Swap] [Keep]                   │
│                                     │
│  ✅ Newman's Own Pasta Sauce   91%  │
│     (already aligned!)              │
├─────────────────────────────────────┤
│  📊 List Score: 74% aligned        │
│  💰 Est. total: $67.40             │
│                                     │
│  [🏪 Pickup at Safeway]            │
│  [📦 Order on Amazon]              │
└─────────────────────────────────────┘
```

## Technical Requirements
- New DB tables: `shopping_lists`, `list_items`, `user_preferences`, `swap_history`
- Kroger API integration (already have keys)
- Amazon cart URL builder (affiliate tag)
- Store locator (already built)
- Push notifications: "Your weekly list is ready" (future)

## Priority
This is THE feature that turns one-time scanners into weekly active users.
Scan = curiosity. Shopping list = habit. Habit = revenue.

Build after scoring is solid (need Scout's data first).

---

*"The user isn't our product. The user is our mission."*
