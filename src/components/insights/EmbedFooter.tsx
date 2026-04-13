function EmbedFooter() {
  const baseUrl = window.location.origin + window.location.pathname
  return (
    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
      <span>One Piece of Data</span>
      <a
        href={`${baseUrl}#/analytics`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-500 transition-colors"
      >
        View full insights &rarr;
      </a>
    </div>
  )
}

export { EmbedFooter }
export default EmbedFooter
