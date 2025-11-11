interface StatCardProps {
  label: string
  value: number | string
  icon: string
  loading?: boolean
}

function StatCard({ label, value, icon, loading = false }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-300">
      <div className="text-4xl mb-3">{icon}</div>
      {loading ? (
        <div className="text-3xl font-bold text-gray-400 mb-2">...</div>
      ) : (
        <div className="text-3xl font-bold text-blue-600 mb-2">{value}</div>
      )}
      <div className="text-gray-600 text-sm font-medium">{label}</div>
    </div>
  )
}

export default StatCard
