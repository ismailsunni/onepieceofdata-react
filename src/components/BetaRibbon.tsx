/**
 * BetaRibbon - A corner ribbon to indicate the website is in beta
 * Displays in the top-right corner with a warning about data accuracy
 */
function BetaRibbon() {
  return (
    <div className="fixed top-0 right-0 z-50 w-32 h-32 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-full h-full">
        {/* Ribbon */}
        <div className="absolute bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg pointer-events-auto transform rotate-45 translate-x-8 translate-y-5 w-40 py-1.5 flex items-center justify-center">
          <span className="text-xs font-bold tracking-widest">BETA</span>
        </div>
      </div>
    </div>
  )
}

export default BetaRibbon
