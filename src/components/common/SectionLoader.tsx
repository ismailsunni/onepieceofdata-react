// Holds the space of client-loaded content (charts) so it doesn't shift the page
const SectionLoader = () => (
  <div className="flex justify-center items-start pt-24 min-h-[70vh]">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
  </div>
)

export default SectionLoader
