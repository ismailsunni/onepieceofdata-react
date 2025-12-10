import { Link } from 'react-router-dom'

interface StatCardProps {
  label: string
  value: number | string
  icon: string
  loading?: boolean
  link?: string
}

function StatCard({ label, value, icon, loading = false, link }: StatCardProps) {
  const content = (
    <>
      <div className="text-4xl mb-3">{icon}</div>
      {loading ? (
        <div className="text-3xl font-bold text-gray-400 mb-2">...</div>
      ) : (
        <div className="text-3xl font-bold text-blue-600 mb-2">{value}</div>
      )}
      <div className="text-gray-600 text-sm font-medium">{label}</div>
    </>
  )

  if (link && !loading) {
    return (
      <Link
        to={link}
        className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer block"
      >
        {content}
        <div className="mt-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
          View Details →
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
      {content}
    </div>
  )
}

export default StatCard
