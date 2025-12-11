import { Link } from 'react-router-dom'

interface CardProps {
  title: string
  description: string
  icon: string
  link?: string
}

function Card({ title, description, icon, link }: CardProps) {
  const content = (
    <div className="flex flex-col h-full">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed flex-grow">{description}</p>
      {link && (
        <div className="mt-6 flex items-center text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          <span>Explore</span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )

  if (link) {
    return (
      <Link
        to={link}
        className="bg-white border border-gray-200 rounded-xl p-8 hover:border-gray-300 hover:shadow-md transition-all duration-200 block group"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8">
      {content}
    </div>
  )
}

export default Card
