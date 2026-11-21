import type { MetaDescriptor } from 'react-router'
import { SITE_HANDLE, SITE_NAME, SITE_URL } from '../constants/site'
import type { PageSeo } from './types'

const DATA_RELEASES_URL =
  'https://github.com/ismailsunni/onepieceofdata/releases'

function jsonLd(seo: PageSeo, url: string) {
  if (seo.path === '/') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/characters?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'One Piece of Data',
        description:
          'Open dataset of One Piece characters, arcs, sagas, chapters, volumes, affiliations and devil fruits, scraped from the One Piece Fandom Wiki.',
        url: SITE_URL,
        license: 'https://creativecommons.org/licenses/by-sa/3.0/',
        isBasedOn: 'https://onepiece.fandom.com/',
        distribution: {
          '@type': 'DataDownload',
          contentUrl: DATA_RELEASES_URL,
        },
      },
    ]
  }
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: SITE_NAME, path: '/' }, ...seo.breadcrumbs].map(
        (b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: b.path === seo.path ? url : `${SITE_URL}${b.path}`,
        })
      ),
    },
  ]
}

export function seoMeta(seo: PageSeo): MetaDescriptor[] {
  const url = `${SITE_URL}${seo.path === '/' ? '' : seo.path}`
  const title = seo.path === '/' ? seo.title : `${seo.title} | ${SITE_NAME}`
  return [
    { title },
    { name: 'description', content: seo.description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: title },
    { property: 'og:description', content: seo.description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: `${SITE_URL}${seo.image}` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: SITE_HANDLE },
    ...jsonLd(seo, url).map((data) => ({ 'script:ld+json': data })),
  ]
}
