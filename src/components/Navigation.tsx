import { NavLink } from 'react-router-dom'

function Navigation() {
  // This function returns the CSS classes for nav links
  // isActive comes from React Router and tells us if this link matches the current page
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = 'px-3 py-2 rounded-md transition-colors duration-200 text-sm md:text-base'
    const activeClass = 'bg-blue-700 text-white'
    const inactiveClass = 'text-blue-100 hover:bg-blue-700 hover:text-white'

    return `${baseClass} ${isActive ? activeClass : inactiveClass}`
  }

  return (
    <nav className="flex flex-wrap gap-2">
      <NavLink to="/" className={getLinkClass}>
        Home
      </NavLink>
      <NavLink to="/characters" className={getLinkClass}>
        Characters
      </NavLink>
      <NavLink to="/arcs" className={getLinkClass}>
        Arcs
      </NavLink>
      <NavLink to="/chapters" className={getLinkClass}>
        Chapters
      </NavLink>
      <NavLink to="/analytics" className={getLinkClass}>
        Analytics
      </NavLink>
      <NavLink to="/about" className={getLinkClass}>
        About
      </NavLink>
    </nav>
  )
}

export default Navigation
