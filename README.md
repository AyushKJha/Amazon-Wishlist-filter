# Amazon Wishlist Filter / Deal Query

Manage manually entered wishlist items, categories and prices with persistent storage, search and CSV/JSON import. No live Amazon prices or sales alerts.

## Run
Node.js 24 or newer. Run npm start, then open http://127.0.0.1:4320. No npm dependencies or build step. Run npm test for acceptance checks.

## Features
Create, edit and delete products; assign category; validate positive manually entered prices; search all fields; import quoted CSV or a JSON array; export JSON. Records persist in data/app.sqlite.

## CSV import
Use headers product_name,category,current_price. Available categories: Electronics, Books, Clothing. Import at most 200 rows at a time. Invalid rows cause the whole import to roll back.

## Hosting and data
Default is a local single-owner app. For hosting set HOST=0.0.0.0 and an APP_PASSWORD of at least 16 characters, and provide HTTPS. Data requires persistent disk; ephemeral free services lose SQLite on redeploy. Back up data/app.sqlite. Database files and credentials are excluded from GitHub.

## Scope
Amazon is the idea source; this application does not connect to Amazon, scrape accounts, obtain live prices or send deal alerts. The hosted ForgeRadar view connects to the database on your laptop worker.
