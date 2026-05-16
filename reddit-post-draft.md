# Reddit post draft — r/onepiece

**Subreddit:** r/onepiece
**Suggested flair:** Misc / Fan Made Content (check current sub rules; some flairs require mod approval for project links)

---

## Title options (pick one)

1. **I built a free site that turns 25+ years of One Piece into interactive data — characters, bounties, arcs, devil fruits, and more**
2. **One Piece of Data — a fan-made analytics & exploration site for the entire series (free, no ads)**
3. **Ever wanted to compare any two characters side-by-side, or see a network graph of who interacts with who? I made a tool for that.**

---

## Body

Hey r/onepiece 👋

I've been working on a side project called **One Piece of Data** — a free, ad-free site that lets you explore the series as structured data instead of scrolling through wiki pages.

🌐 https://onepieceofdata.com

### What's in it

**Explore**
- **Characters** — sortable/filterable table (by saga, arc, chapter, time-skip, status, affiliation, etc.) with detail pages covering bio, appearances, devil fruit, haki, affiliations, and occupations
- **Devil Fruits** — grouped by name + model, with type/sub-type filters and every known user
- **Affiliations & Occupations** — rosters with status breakdowns (e.g. who in the Marines is alive vs. defeated)
- **Sagas / Arcs / Volumes / Chapters** — cross-linked, with featured character portraits

**Analytics dashboards**
- Bounty rankings, demographics, appearance counts, story pacing, data-quality stats
- **Character Compare** — pick any two characters and diff them side-by-side
- **Character Network** — interactive graph of who interacts with who
- **Timeline** & **Appearance Race** — watch screen time accumulate across the run
- **Word Cloud** per character
- **Chapter Release Predictor** — forecasts upcoming Jump issue release dates and break weeks

**Games**
- *Guess the Character* (image quiz) and *Who Am I?* (progressive hints), with local score tracking and shareable result cards

There's also a global search and an AI chat assistant if you'd rather just ask questions.

### How it's built (for the curious)

React + TypeScript on the frontend, Supabase (Postgres) on the backend. Data is scraped from the One Piece Fandom Wiki, cleaned, and modeled relationally so it's actually queryable. Source is open under AGPL-3.0 — happy to share the repo if folks are interested.

### A few caveats

- This is a **fan project**, non-commercial, with no ads or tracking. One Piece is © Eiichiro Oda / Shueisha / Toei.
- Data is only as good as the wiki — there's a "data quality" dashboard that tries to surface gaps honestly. PRs and bug reports very welcome.
- **Spoiler note:** the site shows data through the latest chapter. If you're anime-only or behind, browse carefully.

Would love feedback — what data views would you actually want? Are there analytics you've always wanted to see but the wiki can't really answer?

Thanks 🙏

---

## Posting checklist

- [ ] Check r/onepiece rules for self-promotion / project-share frequency limits
- [ ] Confirm the right flair (Misc, Fan Made Content, or Discussion depending on current options)
- [ ] Add a **[Spoilers]** tag in the title if required by sub conventions
- [ ] Be ready to respond to comments in the first hour (boosts ranking)
- [ ] Cross-post candidates: r/OnePiecePowerScaling, r/MemePiece (lighter tone), r/dataisbeautiful (lead with a chart screenshot instead)
- [ ] Consider attaching a screenshot/GIF of the Character Network or Appearance Race — visuals dramatically outperform text-only posts

## Comment-ready first reply (drop as a top-level comment so people see it)

> Some example links if you want to jump straight in:
> - All characters table → onepieceofdata.com/#/characters
> - Devil fruits → onepieceofdata.com/#/devil-fruits
> - Character network → onepieceofdata.com/#/network
> - Compare two characters → onepieceofdata.com/#/compare
>
> Open to suggestions for new views!
