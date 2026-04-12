function SectionTitle({ title, number }: { title: string; number: string }) {
  return (
    <div className="mt-10 mb-6 flex items-center gap-3">
      <span className="text-xs font-bold text-white bg-gray-900 rounded-full px-3 py-1">
        #{number}
      </span>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gray-200"></div>
    </div>
  )
}

export { SectionTitle }
export default SectionTitle
