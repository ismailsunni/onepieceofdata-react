import { Link } from 'react-router'
import type { PageSeo, SeoLink } from '../../seo/types'

const LinkList = ({ links }: { links: SeoLink[] }) => (
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
    {links.map((l) => (
      <li key={l.to}>
        <Link
          to={l.to}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {l.name}
        </Link>
        {l.note && <span className="text-gray-400"> ({l.note})</span>}
      </li>
    ))}
  </ul>
)

// Plain-text facts and links for every prerendered page, so crawlers can read
// key data that is otherwise only shown in charts and client-loaded tables.
function PageSummary({ seo }: { seo: PageSeo }) {
  const sections = seo.sections.filter((s) => s.links.length)
  return (
    <section
      aria-labelledby="page-summary-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
    >
      <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-8 space-y-4">
        <div>
          <h2
            id="page-summary-heading"
            className="text-lg font-semibold text-gray-900"
          >
            {seo.heading}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{seo.description}</p>
        </div>
        {seo.facts.length > 0 && (
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {seo.facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {sections.map((s) =>
          s.collapsed ? (
            <details key={s.title}>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                {s.title} ({s.links.length})
              </summary>
              <div className="mt-2">
                <LinkList links={s.links} />
              </div>
            </details>
          ) : (
            <div key={s.title}>
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                {s.title}
              </h3>
              <LinkList links={s.links} />
            </div>
          )
        )}
      </div>
    </section>
  )
}

export default PageSummary
