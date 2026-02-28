# Kroger API Reference for DollarVote
### Compiled from developer.kroger.com — Feb 27, 2026

Our API key: `dollarvote-bbcchkn8` (covers Safeway, Fred Meyer, QFC)
Base URL: `https://api.kroger.com`

---

## Authentication

### Service-to-Service (for product search, locations — no customer needed)
```
POST /v1/connect/oauth2/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {{base64(CLIENT_ID:CLIENT_SECRET)}}

grant_type=client_credentials&scope=product.compact
```
Returns: `{ "access_token": "...", "expires_in": 1800, "token_type": "bearer" }`

### Customer Auth (for cart add — needs customer's Kroger/Safeway login)
**OAuth2 Authorization Code Grant — 7 steps:**

1. **Redirect customer to Kroger login:**
```
GET /v1/connect/oauth2/authorize?scope={{SCOPES}}&response_type=code&client_id={{CLIENT_ID}}&redirect_uri={{REDIRECT_URI}}
```
Required params: `scope`, `response_type=code`, `client_id`, `redirect_uri`

2. **Customer signs in and consents** (on Kroger's page)

3. **Kroger redirects back with auth code:**
```
https://YourRedirectUri.com/callback?code=zWrT1GkdshSadIowJW0Rm4w2kKhOzv1W
```

4. **Exchange code for tokens:**
```
POST /v1/connect/oauth2/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {{base64(CLIENT_ID:CLIENT_SECRET)}}

grant_type=authorization_code&code={{CODE}}&redirect_uri={{REDIRECT_URI}}
```

5. **Response:**
```json
{
  "expires_in": 1800,
  "access_token": "eyJh...",
  "token_type": "bearer",
  "refresh_token": "FN20Lba..."
}
```

6. **Use access token for API requests:**
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

7. **Refresh when expired:**
```
POST /v1/connect/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={{REFRESH_TOKEN}}
```

---

## Cart API
**Rate Limit: 5,000 calls/day**
**Requires: Customer OAuth (Authorization Code grant)**

### Add to Cart
```
PUT /v1/cart/add
Authorization: Bearer {{CUSTOMER_ACCESS_TOKEN}}
Content-Type: application/json

{
  "items": [
    { "upc": "0001111041600", "quantity": 1 }
  ]
}
```
- **Response:** 204 OK (no body)
- **Errors:** 400 (bad UPC/params), 401 (unauthorized), 403 (forbidden), 500

---

## Products API
**Rate Limit: 10,000 calls/day**
**Auth: Service-to-service OR customer token**

### Product Search
```
GET /v1/products?filter.term={{SEARCH_TERM}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

### Product Details
```
GET /v1/products/{{PRODUCT_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

### Query Parameters
- `filter.term` — search by term (fuzzy)
- `filter.productId` — search by product ID
- `filter.locationId` — **REQUIRED for price/stock data**
- `filter.limit` — results per page (default 10)
- `filter.start` — skip N results (pagination)

### Response Data (with locationId)
- **Price:** `price.regular`, `price.promo`, `nationalPrice.regular`, `nationalPrice.promo`
- **Fulfillment:** `instore`, `shiptohome`, `delivery`, `curbside` (booleans)
- **Aisle:** aisle locations within the store
- **Inventory:** `stockLevel` = `HIGH` | `LOW` | `TEMPORARILY_OUT_OF_STOCK`
- **Product Page:** `productPageURI` — append to store domain for full URL

---

## Locations API
**Rate Limit: 10,000 calls/day**

### Location Search
```
GET /v1/locations?filter.zipCode.near={{ZIP}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## Scopes
- `product.compact` — product search
- `cart.basic:write` — add to cart (needs customer auth)
- `profile.compact` — customer identity

---

## DollarVote Integration Plan

### Phase 1: Product Search (no customer auth needed)
1. Service-to-service token → search products by UPC
2. Pass `filter.locationId` for nearest Safeway → get price + stock
3. Show "In stock at your Safeway" or "Available for pickup"

### Phase 2: Cart Integration (needs customer auth)
1. User connects Kroger/Safeway account once (OAuth redirect)
2. Store refresh token in our DB
3. "Add to Safeway Cart" button → PUT /v1/cart/add
4. "Add entire list to cart" → batch PUT with all items
5. User opens Safeway app → items are in cart → pickup/delivery

### Phase 3: Smart Lists
1. Track scan history → learn buying habits
2. Auto-generate weekly aligned shopping list
3. Check stock at user's nearest store
4. One button: "Send to Safeway" or "Order on Amazon"
