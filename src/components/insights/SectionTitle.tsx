function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mt-10 mb-6 flex items-center gap-3">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="flex-1 h-px bg-gray-200"></div>
    </div>
  )
}

export { SectionTitle }
export default SectionTitle
