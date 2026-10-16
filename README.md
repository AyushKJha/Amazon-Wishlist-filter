# Wishlist Studio

<img src="docs/banner.svg" alt="Amazon Wishlist filter — project illustration" width="100%">

An offline browser prototype exploring a simple way to bring wishlist items into one searchable view.

## Try it

Open `index.html` in a browser. The starting list contains illustrative sample items; use the CSV upload or paste field to load your own rows. Expected columns, in order:

```csv
product name,category,current price
Wireless headphones,Electronics,149.99
```

Search the imported list by product name and filter it by category.

## Current scope

This is an early front-end prototype. It does not connect to Amazon, fetch live wishlist contents, monitor sale events, or verify current prices. The sample items and prices are illustrative. Import a CSV you have prepared yourself; the app does not scrape websites.

The repository also contains a Node.js/SQLite single-owner workspace scaffold. It is separate from the standalone browser demo; the current browser interface uses its sample list and imported CSV in memory.

## Run the workspace scaffold

Requires Node.js 24 or newer:

```sh
npm start
```

Open [http://127.0.0.1:4320](http://127.0.0.1:4320). To expose the scaffold beyond your computer, set `HOST=0.0.0.0`, a strong `APP_PASSWORD` (at least 16 characters), HTTPS, and durable database storage.
