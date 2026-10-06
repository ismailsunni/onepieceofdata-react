# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Curious fans** browsing: looking up a character, arc, chapter or devil fruit, or playing the games.
- **Data-minded fans**: want stats, rankings, charts and analytics dashboards.
- **Theorists / researchers**: building arguments (e.g. "when does One Piece end?") and need numbers they can cite.

## Product Purpose

One Piece of Data turns the One Piece universe into structured, cross-linked, explorable data: characters, sagas, arcs, chapters, volumes, devil fruits, affiliations, occupations, plus analytics, interactive tools and games. Success means a fan can find a fact quickly and then keep following links and charts deeper.

## Positioning

Reference database and visual analytics carry equal weight. Where the fan wiki offers prose, OPOD offers the same facts as queryable, cross-linked data and charts.

## Operating Context

- Live at https://onepieceofdata.com; static SPA (HashRouter) backed by Supabase.
- Charts are embeddable via `/embed/insights/:chartId` and exported as images with a brand watermark.
- Social reels/carousels are produced from this data in the separate `onepieceofdata-studio` repo.

## Capabilities and Constraints

- Free, no account required; everything public. Static hosting + Supabase free tier.
- Data is scraped and has known gaps and errors; the UI must be honest about completeness (see the Data Quality page) rather than imply exactness.
- Embedded and shared outputs must stay legible outside the site.

## Brand Commitments

- Unofficial fan project: must never imply affiliation with Eiichiro Oda, Shueisha or Toei.
- Name: "One Piece of Data".

## Evidence on Hand

- Real dataset in Supabase (characters, chapters, volumes, arcs, sagas, devil fruits, polls, appearances).
- No testimonials, user counts or press; do not fabricate any.

## Product Principles

1. Facts first: every view leads with the data, decoration is secondary.
2. Everything links: any entity mention should lead to its detail page.
3. Honest data: show gaps and uncertainty instead of hiding them.
4. Shareable by default: charts and results should travel well outside the site.

## Accessibility & Inclusion

WCAG 2.1 AA (see CLAUDE.md).
