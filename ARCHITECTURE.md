# Amazon Wishlist Filter / Deal Query

Prototype for filtering Amazon wishlists by sales events and categories without live data.

Node.js 24+, SQLite, server-side validation, idempotent CRUD requests, reviewed browser interface. Database is excluded from GitHub. Owner app data stays on the worker.

- Upload CSV with wishlist items (product name, category, current price)
- Apply in-memory filters based on user-defined sales events and categories
- Display filtered results with price comparison