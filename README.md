# Wishlist Studio

An offline browser prototype for organizing a manually supplied wishlist. This is not an Amazon API integration and does not track live prices.

## Features
- Import a CSV file or paste CSV text.
- Supports quoted fields, commas inside names, reordered required columns and CRLF line endings.
- Search products and filter categories in memory.
- Validate required columns, item names and finite nonnegative prices before replacing the list.
- Render user data through textContent, without injecting HTML.

## Run
Open index.html in a browser, or use the sandboxed preview in ForgeRadar. No packages, server or internet connection are needed.

CSV headers: product name, category, current price. Sample data and prices are illustrative. Imported data is kept only in memory and clears on refresh. Maximum input size: 1 MB.

## Validation
Browser checks passed for initial rendering, category filtering, product search, pasted CSV with quoted names and invalid-price handling. The automated file-picker check was unavailable because of browser-extension file access; file selection is not claimed as automatically verified.

See PROPOSAL.md, ARCHITECTURE.md, TASKS.md and QA.md for scope and review notes.
