# Amazon Wishlist Filter / Deal Query

<img src="banner.svg" alt="Amazon Wishlist Filter / Deal Query project illustration" width="100%">

A simple wishlist organizer for keeping product names, categories, and prices searchable in one place.

## Public web app

**Open the app:** https://ayushkjha.github.io/Amazon-Wishlist-filter/

The hosted app saves records in this browser on this device. Records are not sent to a server or synchronized across devices. Use **Export JSON** for backups or to move records.

## Features

- Create, search, edit, and delete wishlist items.
- Import CSV or JSON and export JSON backups.

## Limits

It does not sign in to Amazon, fetch wishlist data, track live prices, or find current deals.

## Run the private local version

Requires Node.js 24 or newer. From this repository, run:

```sh
npm test
node server.mjs
```

The local Node.js version stores records in SQLite under `data/`. The public browser version does not access this database.
