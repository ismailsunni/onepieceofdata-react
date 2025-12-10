import { Link } from 'react-router-dom'

interface CardProps {
  title: string
  description: string
  icon: string
  link?: string
}

function Card({ title, description, icon, link }: CardProps) {
  const content = (
    <>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </>
  )

  if (link) {
    return (
      <Link
        to={link}
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer block group"
      >
        {content}
        <div className="mt-4 text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Explore →
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300">
      {content}
    </div>
  )
}

export default Card
