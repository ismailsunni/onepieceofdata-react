import { useQuery } from '@tanstack/react-query'
import { fetchCharacterBirthdays, BirthdaysByDate } from '../services/analyticsService'
import { useState } from 'react'

interface CalendarDay {
  date: number
  month: number
  year: number
  dateKey: string
  isCurrentMonth: boolean
  birthdayCount: number
  characters: { name: string; birth_date: string }[]
}

function CharacterBirthdayPage() {
  const currentYear = new Date().getFullYear()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null)

  const { data: birthdaysData, isLoading, error } = useQuery<BirthdaysByDate>({
    queryKey: ['analytics', 'character-birthdays'],
    queryFn: fetchCharacterBirthdays,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get intensity color based on birthday count
  const getIntensityColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100'
    if (count === 1) return 'bg-blue-200'
    if (count === 2) return 'bg-blue-400'
    if (count === 3) return 'bg-blue-600'
    return 'bg-blue-800'
  }

  // Generate calendar days for a specific month
  const generateCalendarDays = (year: number, month: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: CalendarDay[] = []

    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i
      const dateKey = `${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      days.push({
        date,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        dateKey,
        isCurrentMonth: false,
        birthdayCount: 0,
        characters: [],
      })
    }

    // Add current month's days
    for (let date = 1; date <= daysInMonth; date++) {
      const dateKey = `${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      const characters = birthdaysData?.[dateKey] || []
      days.push({
        date,
        month,
        year,
        dateKey,
        isCurrentMonth: true,
        birthdayCount: characters.length,
        characters,
      })
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      const dateKey = `${String(month + 2).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      days.push({
        date,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        dateKey,
        isCurrentMonth: false,
        birthdayCount: 0,
        characters: [],
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays(currentYear, selectedMonth)

  // Calculate statistics
  const totalBirthdays = birthdaysData
    ? Object.values(birthdaysData).reduce((sum, chars) => sum + chars.length, 0)
    : 0

  const datesWithBirthdays = birthdaysData ? Object.keys(birthdaysData).length : 0

  const maxBirthdaysOnOneDay = birthdaysData
    ? Math.max(...Object.values(birthdaysData).map((chars) => chars.length), 0)
    : 0

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading birthday calendar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>Error loading birthday data. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Character Birthday Calendar
        </h1>
        <p className="text-lg text-gray-600">
          Explore when One Piece characters were born throughout the year
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Characters</h3>
          <p className="text-3xl font-bold text-blue-600">{totalBirthdays}</p>
          <p className="text-sm text-gray-500 mt-1">with known birthdays</p>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Unique Dates</h3>
          <p className="text-3xl font-bold text-green-600">{datesWithBirthdays}</p>
          <p className="text-sm text-gray-500 mt-1">days with birthdays</p>
        </div>
        <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Busiest Day</h3>
          <p className="text-3xl font-bold text-purple-600">{maxBirthdaysOnOneDay}</p>
          <p className="text-sm text-gray-500 mt-1">characters in one day</p>
        </div>
      </div>

      {/* Month Selector */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Previous
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[selectedMonth]} {currentYear}
        </h2>
        <button
          onClick={() => setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1))}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Birthday Count Legend:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">No birthdays</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">1 character</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-400 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">2 characters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">3 characters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-800 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">4+ characters</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                relative aspect-square border-2 rounded-lg p-2 transition-all cursor-pointer
                ${day.isCurrentMonth ? 'border-gray-300' : 'border-gray-200'}
                ${day.isCurrentMonth ? getIntensityColor(day.birthdayCount) : 'bg-gray-50'}
                ${day.birthdayCount > 0 ? 'hover:ring-4 hover:ring-blue-300 hover:scale-105' : ''}
              `}
              onMouseEnter={() => day.birthdayCount > 0 && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div
                className={`text-center text-sm font-medium ${
                  day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {day.date}
              </div>
              {day.birthdayCount > 0 && (
                <div className="absolute bottom-1 right-1 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-blue-600 border-2 border-blue-600">
                  {day.birthdayCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && hoveredDay.birthdayCount > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white border-2 border-blue-600 rounded-lg shadow-2xl p-4 max-w-md z-50">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {monthNames[hoveredDay.month]} {hoveredDay.date}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {hoveredDay.birthdayCount} character{hoveredDay.birthdayCount > 1 ? 's' : ''} born on this day:
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {hoveredDay.characters.map((char, idx) => (
              <div key={idx} className="text-sm text-gray-700 py-1 px-2 bg-blue-50 rounded">
                {char.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Hover over colored dates to see which characters were born on that day.
          Use the navigation buttons to explore different months.
        </p>
      </div>
    </main>
  )
}

export default CharacterBirthdayPage
