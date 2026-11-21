export interface SeoLink {
  name: string
  to: string
  note?: string
}

// Everything a prerendered page needs for its <head>, its indexable summary
// and its OG card. Values are preformatted strings so the server render and
// hydration always match.
export interface PageSeo {
  path: string
  kind: string // card label, e.g. "Character"
  heading: string
  title: string
  description: string
  image: string // site-relative path of the OG card
  facts: [string, string][]
  sections: { title: string; links: SeoLink[]; collapsed?: boolean }[]
  breadcrumbs: { name: string; path: string }[]
}
