# Amazon Wishlist Filter / Deal Query

Users have over 1000 items in Amazon wishlists but lack filtering by sales events (e.g., Black Friday) or categories, leading to inefficient shopping.

## Project direction
Create new project · Community idea request

Originality is unverified; review the existing-solution check before claiming novelty.

## Target users
Amazon shoppers with large wishlists

## MVP
- Manual CSV upload for wishlist items (with columns: product name, category, current price)
- In-memory filter by sales event (e.g., Black Friday) and category
- Local DOM display of filtered results with manual price comparison

## Suggested stack
Browser prototype: HTML, CSS and JavaScript

## Critic
The candidate claims a novel solution for Amazon wishlist filtering, but existing tools like 'ApniWish' (GitHub) and 'amazon-wishlist-sale-picker' (browser extension) already handle category-based filtering and sale detection. This undermines the novelty score as similar products exist in the GitHub ecosystem. The MVP's reliance on localStorage risks data loss across sessions without robust persistence mechanisms.

## Evidence
- App Idea: Amazon Wishlist Filter / Deal Query — https://www.reddit.com/r/AppIdeas/comments/1wx1p23/app_idea_amazon_wishlist_filter_deal_query/

Scoring method: Agent pipeline · local AI. Scores are estimates, not adoption predictions.

## Why this candidate
Addresses inefficiency in managing large wishlists through manual input of deal criteria.
