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
      <div className="text-2xl mb-2">{icon}</div>
      {loading ? (
        <div className="text-2xl font-bold text-gray-400 mb-1">...</div>
      ) : (
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      )}
      <div className="text-gray-600 text-sm">{label}</div>
    </>
  )

  if (link && !loading) {
    return (
      <Link
        to={link}
        className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:border-gray-300 hover:shadow-sm transition-all duration-200 block group"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
      {content}
    </div>
  )
}

export default StatCard
