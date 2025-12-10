import { useQuery } from '@tanstack/react-query'
import { fetchCharacterBirthdays, BirthdaysByDate } from '../services/analyticsService'
import { useState } from 'react'
import { Link } from 'react-router-dom'

interface CalendarDay {
  date: number
  month: number
  year: number
  dateKey: string
  isCurrentMonth: boolean
  birthdayCount: number
  characters: { id: string; name: string; birth_date: string }[]
}

function CharacterBirthdayPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
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

  // Get text color for date number based on background intensity
  const getDateTextColor = (count: number): string => {
    if (count >= 3) return 'text-white' // Dark backgrounds need white text
    return 'text-gray-800' // Light backgrounds use dark text
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

  // Navigation functions
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const goToToday = () => {
    const now = new Date()
    setSelectedYear(now.getFullYear())
    setSelectedMonth(now.getMonth())
    setViewMode('month')
  }

  const calendarDays = generateCalendarDays(selectedYear, selectedMonth)

  // Generate mini calendar for year view
  const generateMiniMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: CalendarDay[] = []

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: 0,
        month,
        year,
        dateKey: '',
        isCurrentMonth: false,
        birthdayCount: 0,
        characters: [],
      })
    }

    // Add actual days
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

    return days
  }

  // Calculate statistics
  const totalBirthdays = birthdaysData
    ? Object.values(birthdaysData).reduce((sum, chars) => sum + chars.length, 0)
    : 0

  const datesWithBirthdays = birthdaysData ? Object.keys(birthdaysData).length : 0

  const maxBirthdaysOnOneDay = birthdaysData
    ? Math.max(...Object.values(birthdaysData).map((chars) => chars.length), 0)
    : 0

  // Find the busiest day(s)
  const busiestDays = birthdaysData
    ? Object.entries(birthdaysData)
        .filter(([_, chars]) => chars.length === maxBirthdaysOnOneDay)
        .map(([date, chars]) => ({ date, characters: chars }))
    : []

  // Calculate dates without birthdays
  const getDatesWithoutBirthdays = () => {
    if (!birthdaysData) return []

    const allDates: string[] = []
    // Generate all possible dates (MM-DD format)
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(2024, month, 0).getDate() // Using 2024 (leap year) to get all possible days
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        allDates.push(dateKey)
      }
    }

    // Filter dates that don't have birthdays
    return allDates.filter(date => !birthdaysData[date])
  }

  const datesWithoutBirthdays = getDatesWithoutBirthdays()

  // Format date for display (MM-DD to "Month Day")
  const formatDate = (dateKey: string): string => {
    const [month, day] = dateKey.split('-')
    const monthIndex = parseInt(month) - 1
    return `${monthNames[monthIndex]} ${parseInt(day)}`
  }

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
          {datesWithoutBirthdays.length > 0 && (
            <details className="mt-3 cursor-pointer">
              <summary className="text-xs font-medium text-gray-600 hover:text-green-700 cursor-pointer select-none">
                {datesWithoutBirthdays.length} dates without birthdays
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto bg-gray-50 rounded p-2">
                <div className="grid grid-cols-2 gap-1">
                  {datesWithoutBirthdays.map((date) => (
                    <div
                      key={date}
                      className="text-xs text-gray-600 px-1 py-0.5"
                    >
                      {formatDate(date)}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>

        <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Busiest Day</h3>
          <p className="text-3xl font-bold text-purple-600">{maxBirthdaysOnOneDay}</p>
          <p className="text-sm text-gray-500 mt-1">characters in one day</p>
          {busiestDays.length > 0 && (
            <details className="mt-3 cursor-pointer">
              <summary className="text-xs font-medium text-gray-600 hover:text-purple-700 cursor-pointer select-none">
                {busiestDays.length > 1 ? `${busiestDays.length} dates` : formatDate(busiestDays[0].date)}
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                {busiestDays.map(({ date, characters }) => (
                  <div key={date} className="bg-purple-50 rounded p-2">
                    {busiestDays.length > 1 && (
                      <div className="text-xs font-bold text-purple-700 mb-1">
                        {formatDate(date)}
                      </div>
                    )}
                    <div className="space-y-1">
                      {characters.map((char) => (
                        <Link
                          key={char.id}
                          to={`/characters/${char.id}`}
                          className="block text-xs text-gray-700 px-2 py-1 bg-white rounded hover:bg-purple-100 hover:ring-1 hover:ring-purple-500 transition-all cursor-pointer"
                        >
                          {char.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* View Toggle and Navigation */}
      <div className="mb-6 flex flex-col gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center justify-center gap-2">
          <div className="inline-flex rounded-full bg-blue-600 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-transparent text-white hover:text-blue-100'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${
                viewMode === 'year'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-transparent text-white hover:text-blue-100'
              }`}
            >
              Year View
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-medium cursor-pointer shadow-md"
          >
            Today
          </button>
        </div>

        {/* Navigation */}
        {viewMode === 'month' ? (
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              ← Previous
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[selectedMonth]} {selectedYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              ← {selectedYear - 1}
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{selectedYear}</h2>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {selectedYear + 1} →
            </button>
          </div>
        )}
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
      {viewMode === 'month' ? (
        /* Month View */
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
                  border-2 rounded-lg p-2 transition-all min-h-24
                  ${day.isCurrentMonth ? 'border-gray-300' : 'border-gray-200'}
                  ${day.isCurrentMonth ? getIntensityColor(day.birthdayCount) : 'bg-gray-50'}
                `}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth
                      ? getDateTextColor(day.birthdayCount)
                      : 'text-gray-400'
                  }`}
                >
                  {day.date}
                </div>
                {day.birthdayCount > 0 && day.isCurrentMonth && (
                  <div className="space-y-1">
                    {day.characters.map((char, idx) => (
                      <Link
                        key={idx}
                        to={`/characters/${char.id}`}
                        className="block text-xs text-gray-700 px-1 py-0.5 bg-white bg-opacity-80 rounded truncate hover:bg-opacity-100 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                        title={char.name}
                      >
                        {char.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Year View */
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {monthNames.map((monthName, monthIndex) => {
              const miniDays = generateMiniMonth(selectedYear, monthIndex)
              return (
                <div
                  key={monthIndex}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedMonth(monthIndex)
                    setViewMode('month')
                  }}
                >
                  <h3 className="text-center font-bold text-gray-800 mb-2 text-sm">
                    {monthName}
                  </h3>
                  {/* Mini day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx} className="text-center text-xs text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>
                  {/* Mini calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {miniDays.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`
                          aspect-square flex items-center justify-center text-xs rounded
                          ${day.date === 0 ? '' : getIntensityColor(day.birthdayCount)}
                          ${day.date === 0 ? 'text-transparent' : getDateTextColor(day.birthdayCount)}
                        `}
                        onMouseEnter={() => day.birthdayCount > 0 && setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        {day.date || ''}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hover tooltip - Only for Year View */}
      {viewMode === 'year' && hoveredDay && hoveredDay.birthdayCount > 0 && (
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
          {viewMode === 'month'
            ? 'Character names are shown directly in each date. Use the toggle to switch to Year View for an overview.'
            : 'Hover over colored dates to see character names. Click any month to view its full calendar with all details.'}
        </p>
      </div>
    </main>
  )
}

export default CharacterBirthdayPage
